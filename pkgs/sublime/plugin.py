from __future__ import annotations

import base64
import html
import json
import os
import re
import subprocess
import threading
import uuid
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
RUNTIME_FILE = "runtime.mjs"
RUNTIME_RESOURCE = f"Packages/{PACKAGE_NAME}/{RUNTIME_FILE}"
NODE_VERSION_REQUIREMENT = ">=20.19.0"
MINIMUM_MAA_VERSION = (5, 5, 0)
NPM_REGISTRIES = {
    "npm": "https://registry.npmjs.org",
    "cnpm": "https://registry.npmmirror.com",
}
INTERFACE_FILES = {"interface.json", "interface.jsonc"}
IGNORED_DIRECTORIES = {"node_modules", "MaaUtils", "MaaDeps"}
STATUS_KEY = "maa_framework_project"
_known_maa_workspaces: set[Path] = set()


class MaaRuntimeManager:
    def __init__(self) -> None:
        self.process = None
        self.window = None
        self.state = "idle"
        self._callbacks = {}
        self._next_id = 1
        self._lock = threading.Lock()
        self.history = []
        self.latest_recognition = None
        self.latest_action = None
        self.project = None

    def start(self, project: Path, window) -> None:
        self.window = window
        self.project = project
        try:
            settings = sublime.load_settings(SETTINGS_FILE)
            if settings.get("admin_mode", False) and os.name == "nt" and not _is_admin():
                raise RuntimeError(
                    "admin mode requires restarting Sublime Text with Run as administrator"
                )
            node, module_path = self._prepare_native()
            runtime = LspMaaFrameworkPlugin._resolve_runtime_path()
            if runtime is None:
                raise RuntimeError("bundled runtime.mjs not found")
            self._ensure_process(node, runtime)
            log_dir = project / "debug"
            log_dir.mkdir(parents=True, exist_ok=True)
            self.request(
                "start",
                {
                    "modulePath": str(module_path),
                    "project": str(project),
                    "debugMode": settings.get("debug_mode", True),
                    "saveDraw": settings.get("save_draw", False),
                    "logDir": str(log_dir),
                    "breakTasks": _break_tasks(project),
                    "agentTimeout": settings.get("agent_timeout", 30000),
                },
                self._started,
            )
        except Exception as error:
            self.state = "failed"
            sublime.status_message(f"MaaFramework: cannot start runtime: {error}")

    def control(self, method: str) -> None:
        if not self.process or self.process.poll() is not None:
            sublime.status_message("MaaFramework: runtime is not running")
            return
        self.request(method, {}, lambda _result: None)

    def show_status(self, window) -> None:
        if not self.process or self.process.poll() is not None:
            _show_report(
                window,
                "MaaFramework Runtime Status",
                json.dumps(
                    {"status": self.state, "history": self.history},
                    ensure_ascii=False,
                    indent=4,
                )
                + "\n",
                "Packages/JSON/JSON.sublime-syntax",
            )
            return
        self.request(
            "status",
            {},
            lambda result: _show_report(
                window,
                "MaaFramework Runtime Status",
                json.dumps(result, ensure_ascii=False, indent=4) + "\n",
                "Packages/JSON/JSON.sublime-syntax",
            ),
        )

    def show_latest_detail(self, window) -> None:
        if self.latest_recognition is not None:
            method = "recognitionDetail"
            detail_id = self.latest_recognition
        elif self.latest_action is not None:
            method = "actionDetail"
            detail_id = self.latest_action
        else:
            sublime.status_message("MaaFramework: no recognition or action detail is available")
            return
        if not self.process or self.process.poll() is not None:
            sublime.status_message("MaaFramework: runtime is not running")
            return

        def show(result) -> None:
            if result is None:
                sublime.status_message("MaaFramework: native detail is no longer available")
                return
            display = dict(result) if isinstance(result, dict) else result
            if isinstance(display, dict):
                if isinstance(display.get("raw"), str):
                    display["raw"] = f"<PNG data URL, {len(display['raw'])} chars>"
                if isinstance(display.get("draws"), list):
                    display["draws"] = [
                        f"<PNG data URL, {len(item)} chars>" if isinstance(item, str) else item
                        for item in display["draws"]
                    ]
            _show_report(
                window,
                f"MaaFramework {method} {detail_id}",
                json.dumps(display, ensure_ascii=False, indent=4) + "\n",
                "Packages/JSON/JSON.sublime-syntax",
            )

        self.request(method, {"id": detail_id}, show)

    def set_breakpoints(self, tasks: list[str]) -> None:
        if self.process and self.process.poll() is None:
            self.request("setBreakpoints", {"tasks": tasks}, lambda _result: None)

    def capture(self, window) -> None:
        self._request_image(window, "screenshot", {}, "screenshot")

    def crop(self, window, rect: list[int]) -> None:
        self._request_image(window, "cropScreenshot", {"rect": rect}, "crop")

    def test_ocr(self, window) -> None:
        self._request_recognition(window, "testOcr", {}, "OCR Test")

    def test_template_match(self, window, template: Path) -> None:
        try:
            if template.suffix.lower() != ".png" or not template.is_file():
                raise RuntimeError("template must be an existing PNG file")
            encoded = base64.b64encode(template.read_bytes()).decode("ascii")
            self._request_recognition(
                window,
                "testTemplateMatch",
                {"template": f"data:image/png;base64,{encoded}"},
                "Template Match Test",
            )
        except Exception as error:
            sublime.status_message(f"MaaFramework: cannot read template: {error}")

    def test_pipeline_recognition(self, window, task: str) -> None:
        self._request_recognition(
            window,
            "testPipelineRecognition",
            {"task": task},
            f"Pipeline Recognition: {task}",
        )

    def _request_recognition(
        self, window, method: str, params: dict[str, Any], title: str
    ) -> None:
        if not self.process or self.process.poll() is not None:
            sublime.status_message("MaaFramework: runtime is not running")
            return
        self.request(
            method,
            params,
            lambda result: _show_report(
                window,
                f"MaaFramework {title}",
                json.dumps(result, ensure_ascii=False, indent=4) + "\n",
                "Packages/JSON/JSON.sublime-syntax",
            ),
        )

    def _request_image(self, window, method: str, params: dict[str, Any], label: str) -> None:
        if not self.process or self.process.poll() is not None:
            sublime.status_message("MaaFramework: runtime is not running")
            return
        self.request(
            method,
            params,
            lambda result: self._save_image(window, label, result),
        )

    def _save_image(self, window, label: str, result: Any) -> None:
        if not isinstance(result, str) or not result.startswith("data:image/png;base64,"):
            sublime.status_message("MaaFramework: runtime returned an invalid PNG image")
            return
        try:
            image = base64.b64decode(result.partition(",")[2], validate=True)
            root = (
                self.project / "debug" / "screenshot"
                if self.project is not None
                else Path(sublime.cache_path()) / PACKAGE_NAME / "screenshot"
            )
            root.mkdir(parents=True, exist_ok=True)
            target = root / f"{label}-{uuid.uuid4().hex[:12]}.png"
            target.write_bytes(image)
            window.open_file(str(target))
            sublime.status_message(f"MaaFramework: saved {target}")
        except Exception as error:
            sublime.status_message(f"MaaFramework: cannot save image: {error}")

    def request(self, method: str, params: dict[str, Any], callback) -> None:
        process = self.process
        if not process or not process.stdin or process.poll() is not None:
            raise RuntimeError("runtime process is not running")
        with self._lock:
            request_id = self._next_id
            self._next_id += 1
            self._callbacks[request_id] = callback
            process.stdin.write(
                json.dumps({"id": request_id, "method": method, "params": params}) + "\n"
            )
            process.stdin.flush()

    def shutdown(self) -> None:
        process = self.process
        if not process or process.poll() is not None:
            return
        try:
            self.request("shutdown", {}, lambda _result: None)
        except Exception:
            process.terminate()

    def fetch_versions(self, callback) -> None:
        try:
            settings = sublime.load_settings(SETTINGS_FILE)
            registry = settings.get("npm_registry", NPM_REGISTRIES["npm"])
            node = NodeManager.resolve(PACKAGE_NAME, NODE_VERSION_REQUIREMENT)
            command = [str(part) for part in node.npm_command()]
            command.extend(
                [
                    "view",
                    "@maaxyz/maa-node",
                    "versions",
                    "--json",
                    "--registry",
                    registry,
                ]
            )
            completed = subprocess.run(
                command,
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                env={**os.environ, **node.node_env()},
                creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
                timeout=120,
                check=False,
            )
            if completed.returncode != 0:
                raise RuntimeError(completed.stderr.strip() or "npm view failed")
            value = json.loads(completed.stdout)
            versions = value if isinstance(value, list) else [value]
            versions = [
                version
                for version in versions
                if isinstance(version, str) and _maa_version_key(version) is not None
            ]
            versions.sort(key=lambda version: _maa_version_key(version) or (), reverse=True)
            installed_root = Path(sublime.cache_path()) / PACKAGE_NAME / "native"
            installed = {
                directory.name
                for directory in installed_root.iterdir()
                if directory.is_dir()
            } if installed_root.is_dir() else set()
            sublime.set_timeout(lambda: callback(versions, installed))
        except Exception as error:
            sublime.set_timeout(
                lambda error=error: sublime.status_message(
                    f"MaaFramework: cannot fetch native versions: {error}"
                )
            )

    def _prepare_native(self):
        settings = sublime.load_settings(SETTINGS_FILE)
        version = settings.get("maa_version", "5.12.2")
        registry = settings.get("npm_registry", "https://registry.npmjs.org")
        if not isinstance(version, str) or not re.fullmatch(
            r"\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?", version
        ):
            raise RuntimeError(f"invalid MaaFramework version {version!r}")
        if not isinstance(registry, str) or not registry.startswith(("https://", "http://")):
            raise RuntimeError(f"invalid npm registry {registry!r}")
        node = NodeManager.resolve(PACKAGE_NAME, NODE_VERSION_REQUIREMENT)
        install = Path(sublime.cache_path()) / PACKAGE_NAME / "native" / version
        module_path = install / "node_modules"
        native_entry = module_path / "@maaxyz" / "maa-node" / "dist" / "index-client.js"
        if not native_entry.is_file():
            install.mkdir(parents=True, exist_ok=True)
            sublime.status_message(f"MaaFramework: installing native runtime {version}…")
            command = [str(part) for part in node.npm_command()]
            command.extend(
                [
                    "install",
                    "--prefix",
                    str(install),
                    "--omit=dev",
                    "--no-audit",
                    "--no-fund",
                    "--registry",
                    registry,
                    f"@maaxyz/maa-node@{version}",
                ]
            )
            completed = subprocess.run(
                command,
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                env={**os.environ, **node.node_env()},
                creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
                timeout=600,
                check=False,
            )
            if completed.returncode != 0 or not native_entry.is_file():
                detail = completed.stderr.strip() or completed.stdout.strip()
                raise RuntimeError(f"npm install failed: {detail}")
        return node, module_path

    def _ensure_process(self, node, runtime: Path) -> None:
        if self.process and self.process.poll() is None:
            return
        self.process = subprocess.Popen(
            [str(node.node_binary_path()), str(runtime)],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
            errors="replace",
            bufsize=1,
            env={**os.environ, **node.node_env()},
            creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
        )
        threading.Thread(target=self._read_stdout, daemon=True).start()
        threading.Thread(target=self._read_stderr, daemon=True).start()

    def _read_stdout(self) -> None:
        process = self.process
        if not process or not process.stdout:
            return
        for line in process.stdout:
            try:
                message = json.loads(line)
            except ValueError:
                continue
            if isinstance(message, dict) and isinstance(message.get("id"), int):
                callback = self._callbacks.pop(message["id"], None)
                if "error" in message:
                    sublime.set_timeout(
                        lambda error=message["error"]: self._runtime_error(error)
                    )
                elif callback:
                    sublime.set_timeout(
                        lambda result=message.get("result"), done=callback: done(result)
                    )
            elif isinstance(message, dict) and isinstance(message.get("event"), str):
                sublime.set_timeout(
                    lambda event=message["event"], params=message.get(
                        "params"
                    ): self._event(event, params)
                )
        sublime.set_timeout(self._ended)

    def _read_stderr(self) -> None:
        process = self.process
        if not process or not process.stderr:
            return
        for line in process.stderr:
            print(f"[LSP-MaaFramework runtime] {line.rstrip()}")

    def _started(self, result: Any) -> None:
        self.state = "running"
        tasks = result.get("tasks", []) if isinstance(result, dict) else []
        sublime.status_message(f"MaaFramework: started {len(tasks)} queued task(s)")

    def _event(self, event: str, params: Any) -> None:
        self.history.append({"event": event, "params": params})
        if len(self.history) > 500:
            del self.history[: len(self.history) - 500]
        if event == "state" and isinstance(params, dict):
            self.state = str(params.get("status", self.state))
            sublime.status_message(f"MaaFramework: {self.state}")
        elif event == "task" and isinstance(params, dict):
            sublime.status_message(
                f"MaaFramework: {params.get('name', 'task')} {params.get('status', '')}"
            )
        elif event == "tasker" and isinstance(params, dict):
            if params.get("reco_id") is not None:
                self.latest_recognition = params["reco_id"]
            if params.get("action_id") is not None:
                self.latest_action = params["action_id"]
        _refresh_control_sheets()

    def _runtime_error(self, error: Any) -> None:
        self.state = "failed"
        sublime.status_message(f"MaaFramework runtime: {error}")

    def _ended(self) -> None:
        if self.state not in {"finished", "stopped"}:
            self.state = "exited"
            sublime.status_message("MaaFramework: runtime process exited")
        self.process = None
        self._callbacks.clear()


_runtime_manager = MaaRuntimeManager()


class MaaShortcutController:
    def __init__(self) -> None:
        self.target_window = None

    def activate(self, window) -> None:
        self.target_window = window
        sublime.status_message("MaaFramework: this window is the global shortcut target")

    def route(self, command: str) -> None:
        window = self.target_window
        if window is None:
            sublime.status_message(
                "MaaFramework: activate a shortcut target from the control panel first"
            )
            return
        if command == "start":
            window.run_command("maa_framework_start")
        elif command == "toggle-pause":
            _runtime_manager.control(
                "continue" if _runtime_manager.state == "paused" else "pause"
            )
        elif command == "stop":
            _runtime_manager.control("stop")
        elif command == "screenshot":
            window.run_command("maa_framework_screenshot")


_shortcut_controller = MaaShortcutController()
_control_sheets = {}


def _control_panel_html() -> str:
    buttons = [
        ("Start", "maa_framework_start"),
        ("Pause", "maa_framework_pause"),
        ("Continue", "maa_framework_continue"),
        ("Stop", "maa_framework_stop"),
        ("Status JSON", "maa_framework_runtime_status"),
        ("Latest Detail", "maa_framework_runtime_detail"),
        ("Screenshot", "maa_framework_screenshot"),
        ("Crop", "maa_framework_crop_screenshot"),
        ("OCR Test", "maa_framework_test_ocr"),
        ("Template Match", "maa_framework_test_template_match"),
        ("Pipeline Recognition", "maa_framework_test_pipeline_recognition"),
        ("Refresh", "maa_framework_browser_panel_refresh"),
    ]
    controls = " ".join(
        f'<a class="button" href="{sublime.command_url(command)}">{label}</a>'
        for label, command in buttons
    )
    event_text = html.escape(
        json.dumps(_runtime_manager.history[-50:], ensure_ascii=False, indent=2)
    )
    return f"""
    <body id="maa-framework-panel">
      <style>
        body {{ padding: 1rem; }}
        h1 {{ margin: 0 0 0.75rem 0; }}
        .state {{ font-size: 1.15rem; margin-bottom: 1rem; }}
        .button {{ display: inline-block; padding: 0.35rem 0.65rem; margin: 0 0.3rem 0.4rem 0; border-radius: 0.25rem; background-color: color(var(--foreground) alpha(0.12)); }}
        pre {{ padding: 0.75rem; white-space: pre-wrap; background-color: color(var(--foreground) alpha(0.06)); }}
      </style>
      <h1>MaaFramework Control</h1>
      <div class="state">Runtime: <b>{html.escape(_runtime_manager.state)}</b></div>
      <div>{controls}</div>
      <h2>Recent IPC events</h2>
      <pre>{event_text}</pre>
    </body>
    """


def _refresh_control_sheets() -> None:
    content = _control_panel_html()
    stale = []
    for window_id, sheet in _control_sheets.items():
        try:
            sheet.set_contents(content)
        except Exception:
            stale.append(window_id)
    for window_id in stale:
        _control_sheets.pop(window_id, None)


def _maa_version_key(version: str):
    match = re.fullmatch(r"(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+.*)?", version)
    if not match:
        return None
    base = tuple(int(match.group(index)) for index in range(1, 4))
    if base < MINIMUM_MAA_VERSION:
        return None
    prerelease = match.group(4)
    prerelease_key = tuple(
        (0, int(part)) if part.isdigit() else (1, part)
        for part in (prerelease.split(".") if prerelease else [])
    )
    return (*base, 1 if prerelease is None else 0, prerelease_key)


def _is_admin() -> bool:
    if os.name != "nt":
        return os.geteuid() == 0 if hasattr(os, "geteuid") else False
    try:
        import ctypes

        return bool(ctypes.windll.shell32.IsUserAnAdmin())
    except (AttributeError, OSError):
        return False


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


def _project_interface(project: Path) -> dict[str, Any]:
    interface_file = next(
        (project / name for name in sorted(INTERFACE_FILES) if (project / name).is_file()),
        None,
    )
    return (_load_json_object(interface_file) if interface_file else None) or {}


def _project_config(project: Path) -> Optional[dict[str, Any]]:
    config_file = project / "config" / "maa_pi_config.json"
    return _load_json_object(config_file) if config_file.is_file() else {}


def _break_tasks(project: Path) -> list[str]:
    value = sublime.load_settings(SETTINGS_FILE).get("break_tasks", {})
    if not isinstance(value, dict):
        return []
    tasks = value.get(str(project.resolve()))
    return [task for task in tasks if isinstance(task, str)] if isinstance(tasks, list) else []


def _save_break_tasks(project: Path, tasks: list[str]) -> None:
    settings = sublime.load_settings(SETTINGS_FILE)
    value = settings.get("break_tasks", {})
    mapping = dict(value) if isinstance(value, dict) else {}
    mapping[str(project.resolve())] = tasks
    settings.set("break_tasks", mapping)
    sublime.save_settings(SETTINGS_FILE)


def _write_project_config(project: Path, config: dict[str, Any]) -> Optional[str]:
    config_file = project / "config" / "maa_pi_config.json"
    try:
        config_file.parent.mkdir(parents=True, exist_ok=True)
        temporary = config_file.with_suffix(".json.tmp")
        temporary.write_text(
            json.dumps(config, ensure_ascii=False, indent=4) + "\n",
            encoding="utf-8",
        )
        temporary.replace(config_file)
        return None
    except OSError as error:
        return str(error)


def _project_for_file(file: Path) -> Optional[Path]:
    for parent in file.resolve().parents:
        if any((parent / name).is_file() for name in INTERFACE_FILES):
            return parent
    return None


def _project_status(file: Path) -> Optional[str]:
    project = _project_for_file(file)
    if project is None:
        return None
    interface = _project_interface(project)
    config = _project_config(project) or {}
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
        view.settings().set(STATUS_KEY, True)
    else:
        view.erase_status(STATUS_KEY)
        view.settings().erase(STATUS_KEY)


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
    interface = _project_interface(project)
    if not interface:
        return []
    resources = interface.get("resource")
    if not isinstance(resources, list) or not resources:
        return []
    config = _project_config(project) or {}
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


def _environment_report(window) -> str:
    lines = ["LSP-MaaFramework Environment Check", ""]
    failed = False

    try:
        build = int(sublime.version())
    except (TypeError, ValueError):
        build = 0
    if build >= 4000:
        lines.append(f"[OK] Sublime Text build {build}")
    else:
        lines.append(f"[FAIL] Sublime Text 4 is required (current build: {build or 'unknown'})")
        failed = True

    if sublime.find_resources("LSP.sublime-settings"):
        lines.append("[OK] LSP package is installed")
    else:
        lines.append("[FAIL] LSP package is not installed")
        failed = True

    server = LspMaaFrameworkPlugin._resolve_server_path()
    if server:
        lines.append(f"[OK] maa-lsp server: {server}")
    else:
        lines.append("[FAIL] bundled maa-lsp server is unavailable")
        failed = True

    try:
        node = NodeManager.resolve(PACKAGE_NAME, NODE_VERSION_REQUIREMENT)
        lines.append(
            f"[OK] Node.js {node.resolve_version()}: {node.node_binary_path()}"
        )
    except Exception as error:
        lines.append(f"[FAIL] Node.js {NODE_VERSION_REQUIREMENT}: {error}")
        failed = True

    interfaces = [
        interface_file
        for folder in window.folders()
        for interface_file in _iter_interface_files(Path(folder))
    ]
    if interfaces:
        lines.append(f"[OK] discovered {len(interfaces)} interface project(s)")
    else:
        lines.append("[WARN] no interface.json or interface.jsonc found in open folders")
    for interface_file in interfaces:
        if _load_json_object(interface_file) is None:
            lines.append(f"[FAIL] invalid interface JSONC: {interface_file}")
            failed = True
        config_file = interface_file.parent / "config" / "maa_pi_config.json"
        if config_file.is_file() and _load_json_object(config_file) is None:
            lines.append(f"[FAIL] invalid project config JSON: {config_file}")
            failed = True

    lines.extend(["", f"Result: {'FAIL' if failed else 'PASS'}"])
    return "\n".join(lines) + "\n"


def _show_report(
    window,
    name: str,
    content: str,
    syntax: str = "Packages/Text/Plain text.tmLanguage",
) -> None:
    output = window.new_file()
    output.set_name(name)
    output.set_scratch(True)
    output.assign_syntax(syntax)
    output.run_command("append", {"characters": content})
    output.set_read_only(True)


class _MaaFrameworkSelector:
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
        config = _project_config(project)
        if config is None:
            sublime.status_message(
                f"MaaFramework: cannot update invalid config {config_file}"
            )
            return
        config[self.config_key] = value
        error = _write_project_config(project, config)
        if error:
            sublime.status_message(f"MaaFramework: cannot update selection: {error}")
            return
        _refresh_window_statuses(self.window)
        sublime.status_message(f"MaaFramework: selected {self.item_name} {value}")


class MaaFrameworkSelectControllerCommand(_MaaFrameworkSelector, sublime_plugin.WindowCommand):
    config_key = "controller"
    interface_field = "controller"
    item_name = "controller"


class MaaFrameworkSelectResourceCommand(_MaaFrameworkSelector, sublime_plugin.WindowCommand):
    config_key = "resource"
    interface_field = "resource"
    item_name = "resource"


class MaaFrameworkSelectLocaleCommand(_MaaFrameworkSelector, sublime_plugin.WindowCommand):
    config_key = "__locale"
    interface_field = "languages"
    item_name = "locale"


class MaaFrameworkControlPanelCommand(sublime_plugin.WindowCommand):
    def run(self) -> None:
        project = _active_project(self.window)
        if project is None:
            sublime.status_message(
                "MaaFramework: open a file in a project before opening the control panel"
            )
            return
        config = _project_config(project)
        if config is None:
            sublime.status_message("MaaFramework: cannot read invalid project config")
            return
        tasks = config.get("task")
        tasks = tasks if isinstance(tasks, list) else []
        self._project = project
        self._queued_tasks = [
            task for task in tasks if isinstance(task, dict) and isinstance(task.get("name"), str)
        ]
        labels = [
            "Start Queue",
            "Pause Runtime",
            "Continue Runtime",
            "Stop Runtime",
            "Stop Agent Processes",
            "Show Runtime Status…",
            "Show Latest Recognition / Action Detail…",
            "Capture Screenshot",
            "Crop Screenshot…",
            "Test OCR…",
            "Test Template Match…",
            "Test Pipeline Recognition…",
            "Manage Task Breakpoints…",
            "Select MaaFramework Version…",
            "Select npm Registry…",
            "Toggle Administrator Mode",
            "Toggle Native Debug Mode",
            "Toggle Recognition Drawing",
            "Activate Global Shortcut Target",
            "Open Browser Execution Panel…",
            "Add Task to Queue…",
            "Remove Task from Queue…",
        ]
        labels.extend(
            f"Queue {index + 1}: {task['name']}" for index, task in enumerate(self._queued_tasks)
        )
        self.window.show_quick_panel(labels, self._on_done)

    def _on_done(self, index: int) -> None:
        commands = [
            "maa_framework_start",
            "maa_framework_pause",
            "maa_framework_continue",
            "maa_framework_stop",
            "maa_framework_stop_agents",
            "maa_framework_runtime_status",
            "maa_framework_runtime_detail",
            "maa_framework_screenshot",
            "maa_framework_crop_screenshot",
            "maa_framework_test_ocr",
            "maa_framework_test_template_match",
            "maa_framework_test_pipeline_recognition",
            "maa_framework_breakpoints",
            "maa_framework_select_version",
            "maa_framework_select_registry",
            "maa_framework_toggle_admin",
            "maa_framework_toggle_debug",
            "maa_framework_toggle_save_draw",
            "maa_framework_activate_shortcuts",
            "maa_framework_browser_panel",
            "maa_framework_add_task",
            "maa_framework_remove_task",
        ]
        if 0 <= index < len(commands):
            self.window.run_command(commands[index])
        elif index >= len(commands) and index < len(self._queued_tasks) + len(commands):
            task_name = self._queued_tasks[index - len(commands)]["name"]
            locations = [task for task in _project_tasks(self._project) if task[0] == task_name]
            if locations:
                _, file, line = locations[0]
                self.window.open_file(f"{file}:{line + 1}:1", sublime.ENCODED_POSITION)


class MaaFrameworkStartCommand(sublime_plugin.WindowCommand):
    def run(self) -> None:
        project = _active_project(self.window)
        if project is None:
            sublime.status_message("MaaFramework: no active project")
            return
        config = _project_config(project)
        tasks = config.get("task") if config else None
        if not isinstance(tasks, list) or not tasks:
            sublime.status_message("MaaFramework: task queue is empty")
            return
        sublime.status_message("MaaFramework: preparing runtime…")
        sublime.set_timeout_async(lambda: _runtime_manager.start(project, self.window))


class _MaaFrameworkRuntimeControl:
    method = ""

    def run(self) -> None:
        _runtime_manager.control(self.method)


class MaaFrameworkPauseCommand(_MaaFrameworkRuntimeControl, sublime_plugin.WindowCommand):
    method = "pause"


class MaaFrameworkContinueCommand(_MaaFrameworkRuntimeControl, sublime_plugin.WindowCommand):
    method = "continue"


class MaaFrameworkStopCommand(_MaaFrameworkRuntimeControl, sublime_plugin.WindowCommand):
    method = "stop"


class MaaFrameworkStopAgentsCommand(_MaaFrameworkRuntimeControl, sublime_plugin.WindowCommand):
    method = "stopAgents"


class MaaFrameworkRuntimeStatusCommand(sublime_plugin.WindowCommand):
    def run(self) -> None:
        _runtime_manager.show_status(self.window)


class MaaFrameworkRuntimeDetailCommand(sublime_plugin.WindowCommand):
    def run(self) -> None:
        _runtime_manager.show_latest_detail(self.window)


class MaaFrameworkScreenshotCommand(sublime_plugin.WindowCommand):
    def run(self) -> None:
        _runtime_manager.capture(self.window)


class MaaFrameworkCropScreenshotCommand(sublime_plugin.WindowCommand):
    fields = [("x", "0"), ("y", "0"), ("width", "128"), ("height", "128")]

    def run(self) -> None:
        self._rect = []
        self._ask(0)

    def _ask(self, index: int) -> None:
        if index == len(self.fields):
            _runtime_manager.crop(self.window, self._rect)
            return
        name, initial = self.fields[index]
        self.window.show_input_panel(
            f"Crop {name}",
            initial,
            lambda value: self._on_value(index, value),
            None,
            None,
        )

    def _on_value(self, index: int, value: str) -> None:
        try:
            parsed = int(value)
        except ValueError:
            sublime.status_message(f"MaaFramework: crop {self.fields[index][0]} must be an integer")
            return
        if parsed < 0 or (index >= 2 and parsed == 0):
            sublime.status_message(
                "MaaFramework: crop coordinates must be non-negative and dimensions positive"
            )
            return
        self._rect.append(parsed)
        self._ask(index + 1)


class MaaFrameworkTestOcrCommand(sublime_plugin.WindowCommand):
    def run(self) -> None:
        _runtime_manager.test_ocr(self.window)


class MaaFrameworkTestTemplateMatchCommand(sublime_plugin.WindowCommand):
    def run(self) -> None:
        project = _active_project(self.window)
        initial = str(project) if project else ""
        self.window.show_input_panel(
            "Template PNG path",
            initial,
            lambda value: _runtime_manager.test_template_match(
                self.window, Path(value.strip().strip('"'))
            ),
            None,
            None,
        )


class MaaFrameworkTestPipelineRecognitionCommand(sublime_plugin.WindowCommand):
    def run(self) -> None:
        project = _active_project(self.window)
        if project is None:
            sublime.status_message("MaaFramework: no active project")
            return
        self._tasks = [name for name, _, _ in _project_tasks(project)]
        if not self._tasks:
            sublime.status_message("MaaFramework: no pipeline recognition tasks found")
            return
        self.window.show_quick_panel(self._tasks, self._on_done)

    def _on_done(self, index: int) -> None:
        if 0 <= index < len(self._tasks):
            _runtime_manager.test_pipeline_recognition(self.window, self._tasks[index])


class MaaFrameworkBreakpointsCommand(sublime_plugin.WindowCommand):
    def run(self) -> None:
        self._project = _active_project(self.window)
        if self._project is None:
            sublime.status_message("MaaFramework: no active project")
            return
        self._tasks = [name for name, _, _ in _project_tasks(self._project)]
        if not self._tasks:
            sublime.status_message("MaaFramework: no pipeline tasks found")
            return
        active = set(_break_tasks(self._project))
        self.window.show_quick_panel(
            [f"{'●' if task in active else '○'} {task}" for task in self._tasks],
            self._on_done,
        )

    def _on_done(self, index: int) -> None:
        if index < 0 or index >= len(self._tasks):
            return
        task = self._tasks[index]
        active = set(_break_tasks(self._project))
        if task in active:
            active.remove(task)
            enabled = False
        else:
            active.add(task)
            enabled = True
        tasks = sorted(active, key=str.casefold)
        _save_break_tasks(self._project, tasks)
        _runtime_manager.set_breakpoints(tasks)
        sublime.status_message(
            f"MaaFramework: {'enabled' if enabled else 'disabled'} breakpoint {task}"
        )


class MaaFrameworkSelectVersionCommand(sublime_plugin.WindowCommand):
    def run(self) -> None:
        sublime.status_message("MaaFramework: fetching native versions…")
        sublime.set_timeout_async(lambda: _runtime_manager.fetch_versions(self._show_versions))

    def _show_versions(self, versions: list[str], installed: set[str]) -> None:
        if not versions:
            sublime.status_message("MaaFramework: registry returned no compatible versions")
            return
        self._versions = versions
        current = sublime.load_settings(SETTINGS_FILE).get("maa_version", "5.12.2")
        labels = []
        for version in versions:
            tags = []
            if version == current:
                tags.append("in use")
            if version in installed:
                tags.append("installed")
            suffix = f" — {', '.join(tags)}" if tags else ""
            labels.append(f"{version}{suffix}")
        self.window.show_quick_panel(labels, self._on_done)

    def _on_done(self, index: int) -> None:
        if index < 0 or index >= len(self._versions):
            return
        version = self._versions[index]
        settings = sublime.load_settings(SETTINGS_FILE)
        if settings.get("maa_version") == version:
            return
        _runtime_manager.shutdown()
        settings.set("maa_version", version)
        sublime.save_settings(SETTINGS_FILE)
        sublime.status_message(
            f"MaaFramework: selected {version}; it will be prepared on next start"
        )


class MaaFrameworkSelectRegistryCommand(sublime_plugin.WindowCommand):
    def run(self) -> None:
        current = sublime.load_settings(SETTINGS_FILE).get(
            "npm_registry", NPM_REGISTRIES["npm"]
        )
        self._registries = list(NPM_REGISTRIES.items())
        self.window.show_quick_panel(
            [
                f"{name} — {url}{' (in use)' if url == current else ''}"
                for name, url in self._registries
            ],
            self._on_done,
        )

    def _on_done(self, index: int) -> None:
        if index < 0 or index >= len(self._registries):
            return
        name, registry = self._registries[index]
        settings = sublime.load_settings(SETTINGS_FILE)
        settings.set("npm_registry", registry)
        sublime.save_settings(SETTINGS_FILE)
        sublime.status_message(f"MaaFramework: selected {name} registry {registry}")


class _MaaFrameworkModeToggle:
    setting = ""
    label = "mode"
    default = False

    def run(self) -> None:
        settings = sublime.load_settings(SETTINGS_FILE)
        enabled = not bool(settings.get(self.setting, self.default))
        _runtime_manager.shutdown()
        settings.set(self.setting, enabled)
        sublime.save_settings(SETTINGS_FILE)
        suffix = " (restart Sublime as administrator before starting)" if (
            self.setting == "admin_mode" and enabled and os.name == "nt" and not _is_admin()
        ) else ""
        sublime.status_message(
            f"MaaFramework: {self.label} {'enabled' if enabled else 'disabled'}{suffix}"
        )


class MaaFrameworkToggleAdminCommand(_MaaFrameworkModeToggle, sublime_plugin.WindowCommand):
    setting = "admin_mode"
    label = "administrator mode"


class MaaFrameworkToggleDebugCommand(_MaaFrameworkModeToggle, sublime_plugin.WindowCommand):
    setting = "debug_mode"
    label = "native debug mode"
    default = True


class MaaFrameworkToggleSaveDrawCommand(_MaaFrameworkModeToggle, sublime_plugin.WindowCommand):
    setting = "save_draw"
    label = "recognition drawing"


class MaaFrameworkActivateShortcutsCommand(sublime_plugin.WindowCommand):
    def run(self) -> None:
        _shortcut_controller.activate(self.window)


class MaaFrameworkBrowserPanelCommand(sublime_plugin.WindowCommand):
    def run(self) -> None:
        sheet = self.window.new_html_sheet("MaaFramework Control", _control_panel_html())
        _control_sheets[self.window.id()] = sheet


class MaaFrameworkBrowserPanelRefreshCommand(sublime_plugin.WindowCommand):
    def run(self) -> None:
        _refresh_control_sheets()


class MaaFrameworkShortcutStartCommand(sublime_plugin.WindowCommand):
    def run(self) -> None:
        _shortcut_controller.route("start")


class MaaFrameworkShortcutTogglePauseCommand(sublime_plugin.WindowCommand):
    def run(self) -> None:
        _shortcut_controller.route("toggle-pause")


class MaaFrameworkShortcutStopCommand(sublime_plugin.WindowCommand):
    def run(self) -> None:
        _shortcut_controller.route("stop")


class MaaFrameworkShortcutScreenshotCommand(sublime_plugin.WindowCommand):
    def run(self) -> None:
        _shortcut_controller.route("screenshot")


class MaaFrameworkAddTaskCommand(sublime_plugin.WindowCommand):
    def run(self) -> None:
        self._project = _active_project(self.window)
        if self._project is None:
            sublime.status_message("MaaFramework: no active project")
            return
        entries = _project_interface(self._project).get("task")
        if not isinstance(entries, list):
            entries = []
        self._tasks = [
            entry
            for entry in entries
            if isinstance(entry, dict)
            and isinstance(entry.get("name"), str)
            and isinstance(entry.get("entry"), str)
        ]
        if not self._tasks:
            sublime.status_message("MaaFramework: no interface tasks found")
            return
        self.window.show_quick_panel(
            [f"{task['name']} — {task['entry']}" for task in self._tasks],
            self._on_done,
        )

    def _on_done(self, index: int) -> None:
        if index < 0 or index >= len(self._tasks):
            return
        config = _project_config(self._project)
        if config is None:
            sublime.status_message("MaaFramework: cannot update invalid project config")
            return
        queue = config.get("task")
        if not isinstance(queue, list):
            queue = []
        task = self._tasks[index]
        queue.append({"name": task["name"], "__key": str(uuid.uuid4())})
        config["task"] = queue
        error = _write_project_config(self._project, config)
        if error:
            sublime.status_message(f"MaaFramework: cannot add queued task: {error}")
            return
        sublime.status_message(f"MaaFramework: queued task {task['name']}")


class MaaFrameworkRemoveTaskCommand(sublime_plugin.WindowCommand):
    def run(self) -> None:
        self._project = _active_project(self.window)
        if self._project is None:
            sublime.status_message("MaaFramework: no active project")
            return
        config = _project_config(self._project)
        if config is None:
            sublime.status_message("MaaFramework: cannot update invalid project config")
            return
        tasks = config.get("task")
        self._tasks = tasks if isinstance(tasks, list) else []
        if not self._tasks:
            sublime.status_message("MaaFramework: task queue is empty")
            return
        self.window.show_quick_panel(
            [
                f"Queue {index + 1}: {task.get('name', '<invalid>')}"
                if isinstance(task, dict)
                else f"Queue {index + 1}: <invalid>"
                for index, task in enumerate(self._tasks)
            ],
            self._on_done,
        )

    def _on_done(self, index: int) -> None:
        if index < 0 or index >= len(self._tasks):
            return
        removed = self._tasks.pop(index)
        config = _project_config(self._project)
        if config is None:
            return
        config["task"] = self._tasks
        error = _write_project_config(self._project, config)
        if error:
            sublime.status_message(f"MaaFramework: cannot remove queued task: {error}")
            return
        name = removed.get("name", "<invalid>") if isinstance(removed, dict) else "<invalid>"
        sublime.status_message(f"MaaFramework: removed queued task {name}")


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


class MaaFrameworkCheckEnvironmentCommand(sublime_plugin.WindowCommand):
    def run(self) -> None:
        sublime.set_timeout_async(self._check)

    def _check(self) -> None:
        report = _environment_report(self.window)
        sublime.set_timeout(
            lambda: _show_report(
                self.window,
                "LSP-MaaFramework Environment Check",
                report,
            )
        )


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
        return cls._extract_packaged_file(SERVER_RESOURCE, SERVER_FILE)

    @classmethod
    def _resolve_runtime_path(cls) -> Path | None:
        here = Path(__file__).resolve().parent
        for candidate in [
            here / RUNTIME_FILE,
            here / ".." / "maa-lsp" / "dist" / RUNTIME_FILE,
        ]:
            if candidate.is_file():
                return candidate.resolve()
        return cls._extract_packaged_file(RUNTIME_RESOURCE, RUNTIME_FILE)

    @staticmethod
    def _extract_packaged_server() -> Path | None:
        return LspMaaFrameworkPlugin._extract_packaged_file(SERVER_RESOURCE, SERVER_FILE)

    @staticmethod
    def _extract_packaged_file(resource: str, file_name: str) -> Path | None:
        try:
            content = sublime.load_binary_resource(resource)
        except Exception:
            return None

        target_dir = Path(sublime.cache_path()) / PACKAGE_NAME
        target = target_dir / file_name
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
    _runtime_manager.shutdown()
    LspMaaFrameworkPlugin.unregister()
