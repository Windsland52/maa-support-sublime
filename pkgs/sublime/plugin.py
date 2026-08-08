from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Optional

import sublime
import sublime_plugin
from LSP.plugin import IsApplicableContext
from LSP.plugin import LspPlugin
from LSP.plugin import OnPreStartContext
from LSP.plugin import PluginStartError
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
