from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Optional

import sublime
import sublime_plugin
from LSP.plugin import IsApplicableContext
from LSP.plugin import LspPlugin
from LSP.plugin import LspTextCommand
from LSP.plugin import OnPreStartContext
from LSP.plugin import PluginStartError
from LSP.plugin import Request
from LSP.plugin import filename_to_uri
from lsp_utils import NodeManager

SETTINGS_FILE = "LSP-MaaFramework.sublime-settings"
PACKAGE_NAME = "LSP-MaaFramework"
SERVER_FILE = "server.mjs"
SERVER_RESOURCE = f"Packages/{PACKAGE_NAME}/{SERVER_FILE}"
NODE_VERSION_REQUIREMENT = ">=20.19.0"
INTERFACE_FILES = {"interface.json", "interface.jsonc"}
IGNORED_DIRECTORIES = {"node_modules", "MaaUtils", "MaaDeps"}
STATUS_KEY = "maa_framework_project"
_known_maa_workspaces: set[Path] = set()


def _is_ignored_directory(name: str) -> bool:
    return name.startswith(".") or name in IGNORED_DIRECTORIES


def _workspace_has_interface(root: Path) -> bool:
    root = root.resolve()
    if root in _known_maa_workspaces:
        return True
    try:
        for current, directories, files in os.walk(root, followlinks=False):
            directories[:] = [name for name in directories if not _is_ignored_directory(name)]
            if INTERFACE_FILES.intersection(files):
                _known_maa_workspaces.add(root)
                return True
    except OSError:
        return False
    return False


def _file_has_interface_ancestor(file: Path) -> bool:
    return any(any((parent / name).is_file() for name in INTERFACE_FILES) for parent in file.parents)


def _strip_jsonc(text: str) -> str:
    without_comments: list[str] = []
    index = 0
    in_string = False
    escaped = False
    while index < len(text):
        char = text[index]
        next_char = text[index + 1] if index + 1 < len(text) else ""
        if in_string:
            without_comments.append(char)
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                in_string = False
            index += 1
            continue
        if char == '"':
            in_string = True
            without_comments.append(char)
            index += 1
            continue
        if char == "/" and next_char == "/":
            index += 2
            while index < len(text) and text[index] not in "\r\n":
                index += 1
            continue
        if char == "/" and next_char == "*":
            index += 2
            while index + 1 < len(text) and text[index : index + 2] != "*/":
                index += 1
            index = min(index + 2, len(text))
            continue
        without_comments.append(char)
        index += 1

    cleaned = "".join(without_comments)
    without_trailing_commas: list[str] = []
    index = 0
    in_string = False
    escaped = False
    while index < len(cleaned):
        char = cleaned[index]
        if in_string:
            without_trailing_commas.append(char)
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                in_string = False
            index += 1
            continue
        if char == '"':
            in_string = True
            without_trailing_commas.append(char)
            index += 1
            continue
        if char == ",":
            lookahead = index + 1
            while lookahead < len(cleaned) and cleaned[lookahead].isspace():
                lookahead += 1
            if lookahead < len(cleaned) and cleaned[lookahead] in "]}":
                index += 1
                continue
        without_trailing_commas.append(char)
        index += 1
    return "".join(without_trailing_commas)


def _load_json_object(file: Path) -> Optional[dict[str, Any]]:
    try:
        value = json.loads(_strip_jsonc(file.read_text(encoding="utf-8")))
        return value if isinstance(value, dict) else None
    except (OSError, ValueError):
        return None


def _iter_interface_files(workspace: Path):
    try:
        for current, directories, files in os.walk(workspace.resolve(), followlinks=False):
            directories[:] = [name for name in directories if not _is_ignored_directory(name)]
            for name in sorted(INTERFACE_FILES.intersection(files)):
                yield Path(current, name)
    except OSError:
        return


def _interface_values(interface: dict[str, Any], field: str) -> list[str]:
    if field == "languages":
        languages = interface.get(field)
        return list(languages) if isinstance(languages, dict) else []
    entries = interface.get(field)
    if not isinstance(entries, list):
        return []
    return [
        entry["name"]
        for entry in entries
        if isinstance(entry, dict) and isinstance(entry.get("name"), str)
    ]


def _project_for_file(file: Path) -> Optional[Path]:
    for parent in file.resolve().parents:
        if any((parent / name).is_file() for name in INTERFACE_FILES):
            return parent
    return None


def _project_status(file: Path) -> Optional[str]:
    project = _project_for_file(file)
    if project is None:
        return None
    interface_file = next(
        (project / name for name in sorted(INTERFACE_FILES) if (project / name).is_file()),
        None,
    )
    interface = _load_json_object(interface_file) if interface_file else {}
    interface = interface or {}
    config = _load_json_object(project / "config" / "maa_pi_config.json") or {}
    project_name = interface.get("name")
    if not isinstance(project_name, str) or not project_name:
        project_name = project.name
    resource_names = _interface_values(interface, "resource")
    resource = config.get("resource")
    if not isinstance(resource, str) or resource not in resource_names:
        resource = resource_names[0] if resource_names else "unconfigured"
    parts = [f"MaaFramework: {project_name}", f"resource: {resource}"]
    for key, label in (("controller", "controller"), ("__locale", "locale")):
        value = config.get(key)
        if isinstance(value, str) and value:
            parts.append(f"{label}: {value}")
    return " · ".join(parts)


def _update_view_status(view) -> None:
    file_name = view.file_name()
    status = _project_status(Path(file_name)) if file_name else None
    if status:
        view.set_status(STATUS_KEY, status)
    else:
        view.erase_status(STATUS_KEY)


def _refresh_window_statuses(window) -> None:
    if not window or not hasattr(window, "views"):
        return
    for view in window.views():
        _update_view_status(view)


def _active_project(window) -> Optional[Path]:
    view = window.active_view()
    if view and view.file_name():
        project = _project_for_file(Path(view.file_name()))
        if project:
            return project
    projects = {
        interface_file.parent
        for folder in window.folders()
        for interface_file in _iter_interface_files(Path(folder))
    }
    return next(iter(projects)) if len(projects) == 1 else None


def _top_level_key_lines(text: str) -> list[tuple[str, int]]:
    result: list[tuple[str, int]] = []
    depth = 0
    line = 0
    index = 0
    while index < len(text):
        char = text[index]
        next_char = text[index + 1] if index + 1 < len(text) else ""
        if char == "\n":
            line += 1
            index += 1
            continue
        if char == "/" and next_char == "/":
            newline = text.find("\n", index + 2)
            index = len(text) if newline < 0 else newline
            continue
        if char == "/" and next_char == "*":
            end = text.find("*/", index + 2)
            if end < 0:
                break
            line += text.count("\n", index, end + 2)
            index = end + 2
            continue
        if char == "{":
            depth += 1
            index += 1
            continue
        if char == "}":
            depth -= 1
            index += 1
            continue
        if char != '"':
            index += 1
            continue
        start = index
        start_line = line
        index += 1
        escaped = False
        while index < len(text):
            current = text[index]
            if current == "\n":
                line += 1
            if escaped:
                escaped = False
            elif current == "\\":
                escaped = True
            elif current == '"':
                break
            index += 1
        if index >= len(text):
            break
        literal = text[start : index + 1]
        index += 1
        lookahead = index
        while lookahead < len(text) and text[lookahead].isspace():
            lookahead += 1
        if depth == 1 and lookahead < len(text) and text[lookahead] == ":":
            try:
                key = json.loads(literal)
            except ValueError:
                continue
            if isinstance(key, str):
                result.append((key, start_line))
    return result


def _pipeline_files(project: Path) -> list[Path]:
    interface_file = next(
        (project / name for name in sorted(INTERFACE_FILES) if (project / name).is_file()),
        None,
    )
    interface = _load_json_object(interface_file) if interface_file else None
    if not interface:
        return []
    resources = interface.get("resource")
    if not isinstance(resources, list) or not resources:
        return []
    config = _load_json_object(project / "config" / "maa_pi_config.json") or {}
    selected = config.get("resource")
    resource = next(
        (
            entry
            for entry in resources
            if isinstance(entry, dict) and entry.get("name") == selected
        ),
        None,
    )
    if resource is None:
        resource = next((entry for entry in resources if isinstance(entry, dict)), None)
    if resource is None:
        return []
    paths = resource.get("path")
    if isinstance(paths, str):
        paths = [paths]
    if not isinstance(paths, list):
        return []
    files: list[Path] = []
    for relative in paths:
        if not isinstance(relative, str):
            continue
        root = (project / relative).resolve()
        default_pipeline = root / "default_pipeline.json"
        if default_pipeline.is_file():
            files.append(default_pipeline)
        pipeline = root / "pipeline"
        if not pipeline.is_dir():
            continue
        files.extend(
            file
            for file in sorted(pipeline.rglob("*"))
            if file.is_file()
            and file.suffix in {".json", ".jsonc"}
            and not any(_is_ignored_directory(part) for part in file.relative_to(pipeline).parts)
        )
    return files


def _project_tasks(project: Path) -> list[tuple[str, Path, int]]:
    tasks: dict[str, tuple[Path, int]] = {}
    for file in _pipeline_files(project):
        try:
            text = file.read_text(encoding="utf-8")
            value = json.loads(_strip_jsonc(text))
        except (OSError, ValueError):
            continue
        if not isinstance(value, dict):
            continue
        for name, line in _top_level_key_lines(text):
            if name in value and not name.startswith("$"):
                tasks[name] = (file, line)
    return [(name, *tasks[name]) for name in sorted(tasks, key=str.casefold)]


def _display_path(file: Path, project: Path) -> Path:
    try:
        return file.relative_to(project)
    except ValueError:
        return file


class _MaaFrameworkSelectCommand(sublime_plugin.WindowCommand):
    config_key = ""
    interface_field = ""
    item_name = "value"

    def run(self) -> None:
        self._choices: list[tuple[Path, str]] = []
        labels: list[str] = []
        for folder in self.window.folders():
            workspace = Path(folder)
            for interface_file in _iter_interface_files(workspace):
                interface = _load_json_object(interface_file) or {}
                try:
                    project = str(interface_file.parent.relative_to(workspace)) or "."
                except ValueError:
                    project = str(interface_file.parent)
                for value in _interface_values(interface, self.interface_field):
                    self._choices.append((interface_file.parent, value))
                    labels.append(f"{project} — {value}")
        if not self._choices:
            sublime.status_message(f"MaaFramework: no {self.item_name}s found")
            return
        self.window.show_quick_panel(labels, self._on_done)

    def _on_done(self, index: int) -> None:
        if index < 0 or index >= len(self._choices):
            return
        project, value = self._choices[index]
        config_file = project / "config" / "maa_pi_config.json"
        config = _load_json_object(config_file) if config_file.is_file() else {}
        if config is None:
            sublime.status_message(
                f"MaaFramework: cannot update invalid config {config_file}"
            )
            return
        config[self.config_key] = value
        try:
            config_file.parent.mkdir(parents=True, exist_ok=True)
            temporary = config_file.with_suffix(".json.tmp")
            temporary.write_text(
                json.dumps(config, ensure_ascii=False, indent=4) + "\n",
                encoding="utf-8",
            )
            temporary.replace(config_file)
        except OSError as error:
            sublime.status_message(f"MaaFramework: cannot update selection: {error}")
            return
        _refresh_window_statuses(self.window)
        sublime.status_message(f"MaaFramework: selected {self.item_name} {value}")


class MaaFrameworkSelectControllerCommand(_MaaFrameworkSelectCommand):
    config_key = "controller"
    interface_field = "controller"
    item_name = "controller"


class MaaFrameworkSelectResourceCommand(_MaaFrameworkSelectCommand):
    config_key = "resource"
    interface_field = "resource"
    item_name = "resource"


class MaaFrameworkSelectLocaleCommand(_MaaFrameworkSelectCommand):
    config_key = "__locale"
    interface_field = "languages"
    item_name = "locale"


class MaaFrameworkGotoTaskCommand(sublime_plugin.WindowCommand):
    def run(self) -> None:
        project = _active_project(self.window)
        if project is None:
            sublime.status_message(
                "MaaFramework: open a file in a project before choosing a task"
            )
            return
        self._tasks = _project_tasks(project)
        if not self._tasks:
            sublime.status_message("MaaFramework: no tasks found in the active resource")
            return
        labels = [
            f"{name} — {_display_path(file, project)}:{line + 1}"
            for name, file, line in self._tasks
        ]
        self.window.show_quick_panel(labels, self._on_done)

    def _on_done(self, index: int) -> None:
        if index < 0 or index >= len(self._tasks):
            return
        _, file, line = self._tasks[index]
        self.window.open_file(f"{file}:{line + 1}:1", sublime.ENCODED_POSITION)


class MaaFrameworkEvaluateTaskCommand(LspTextCommand):
    session_name = PACKAGE_NAME

    def run(self, edit) -> None:
        window = self.view.window()
        project = _project_for_file(Path(self.view.file_name())) if self.view.file_name() else None
        if not window or project is None:
            sublime.status_message(
                "MaaFramework: open a file in a project before evaluating a task"
            )
            return
        self._tasks = _project_tasks(project)
        if not self._tasks:
            sublime.status_message("MaaFramework: no tasks found in the active resource")
            return
        window.show_quick_panel([name for name, _, _ in self._tasks], self._on_done)

    def _on_done(self, index: int) -> None:
        if index < 0 or index >= len(self._tasks):
            return
        session = self.session_by_name(PACKAGE_NAME)
        if session is None:
            sublime.status_message("MaaFramework: language server is not running")
            return
        task = self._tasks[index][0]
        file_name = self.view.file_name()
        if not file_name:
            return
        session.send_request(
            Request(
                "maa/evaluateTask",
                {"uri": filename_to_uri(file_name), "task": task},
                self.view,
            ),
            lambda result: sublime.set_timeout(lambda: self._show_result(task, result)),
            self._show_error,
        )

    @staticmethod
    def _show_error(error: Any) -> None:
        message = error.get("message", error) if isinstance(error, dict) else error
        sublime.status_message(f"MaaFramework: task evaluation failed: {message}")

    def _show_result(self, task: str, result: Any) -> None:
        if result is None:
            sublime.status_message(f"MaaFramework: cannot evaluate task {task}")
            return
        window = self.view.window()
        if not window:
            return
        output = window.new_file()
        output.set_name(f"MaaFramework Eval — {task}.json")
        output.set_scratch(True)
        output.assign_syntax("Packages/JSON/JSON.sublime-syntax")
        output.run_command(
            "append",
            {"characters": json.dumps(result, ensure_ascii=False, indent=4) + "\n"},
        )
        output.set_read_only(True)


class MaaFrameworkReloadCommand(LspTextCommand):
    session_name = PACKAGE_NAME

    def run(self, edit) -> None:
        session = self.session_by_name(PACKAGE_NAME)
        if session is None:
            sublime.status_message("MaaFramework: language server is not running")
            return
        session.send_request(
            Request("maa/reloadProjects", {}, self.view),
            self._on_reloaded,
            self._show_error,
        )

    def _on_reloaded(self, result: Any) -> None:
        window = self.view.window()
        sublime.set_timeout(lambda: _refresh_window_statuses(window))
        count = result.get("projects", 0) if isinstance(result, dict) else 0
        sublime.status_message(
            f"MaaFramework: reloaded {count} interface project{'s' if count != 1 else ''}"
        )

    @staticmethod
    def _show_error(error: Any) -> None:
        message = error.get("message", error) if isinstance(error, dict) else error
        sublime.status_message(f"MaaFramework: project reload failed: {message}")


class MaaFrameworkProjectStatusListener(sublime_plugin.EventListener):
    def on_load_async(self, view) -> None:
        _update_view_status(view)

    def on_activated_async(self, view) -> None:
        _update_view_status(view)

    def on_post_save_async(self, view) -> None:
        window = view.window()
        if window:
            _refresh_window_statuses(window)
        else:
            _update_view_status(view)


class LspMaaFrameworkPlugin(LspPlugin):
    """LSP helper package that launches the maa-lsp language server."""

    @classmethod
    def is_applicable_async(cls, context: IsApplicableContext) -> bool:
        if not super().is_applicable_async(context):
            return False
        if any(_workspace_has_interface(Path(folder.path)) for folder in context.workspace_folders):
            return True
        file_name = context.view.file_name()
        return bool(file_name and _file_has_interface_ancestor(Path(file_name)))

    @classmethod
    def on_pre_start_async(cls, context: OnPreStartContext) -> None:
        server_path = cls._resolve_server_path()
        if server_path is None:
            raise PluginStartError(
                "maa-lsp: bundled server.mjs not found. "
                "Reinstall LSP-MaaFramework, build the development repository, "
                f"or set server_path in {SETTINGS_FILE}."
            )
        node_runner = NodeManager.resolve(PACKAGE_NAME, NODE_VERSION_REQUIREMENT)
        context.configuration.env.update(node_runner.node_env())
        context.variables["node_bin"] = str(node_runner.node_binary_path())
        context.variables["server_path"] = str(server_path)

    @classmethod
    def _resolve_server_path(cls) -> Path | None:
        settings = sublime.load_settings(SETTINGS_FILE)
        configured = settings.get("server_path") or ""
        if configured and configured != "auto":
            path = Path(configured)
            if path.is_file():
                return path
        here = Path(__file__).resolve().parent
        candidates = [
            here / SERVER_FILE,
            here / ".." / "maa-lsp" / "dist" / SERVER_FILE,
        ]
        for candidate in candidates:
            if candidate.is_file():
                return candidate.resolve()
        return cls._extract_packaged_server()

    @staticmethod
    def _extract_packaged_server() -> Path | None:
        try:
            content = sublime.load_binary_resource(SERVER_RESOURCE)
        except Exception:
            return None

        target_dir = Path(sublime.cache_path()) / PACKAGE_NAME
        target = target_dir / SERVER_FILE
        try:
            target_dir.mkdir(parents=True, exist_ok=True)
            if not target.is_file() or target.read_bytes() != content:
                target.write_bytes(content)
            return target
        except OSError:
            return None


def plugin_loaded() -> None:
    LspMaaFrameworkPlugin.register()


def plugin_unloaded() -> None:
    LspMaaFrameworkPlugin.unregister()
