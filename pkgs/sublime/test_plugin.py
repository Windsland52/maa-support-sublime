import importlib.util
import json
import sys
import tempfile
import types
import unittest
from pathlib import Path
from urllib.parse import unquote, urlparse


class FakeSettings:
    def __init__(self):
        self.values = {"server_path": "auto"}

    def get(self, key, default=None):
        return self.values.get(key, default)

    def set(self, key, value):
        self.values[key] = value

    def erase(self, key):
        self.values.pop(key, None)


class FakeLspPlugin:
    @classmethod
    def is_applicable_async(cls, context):
        return context.base_applicable

    @classmethod
    def register(cls):
        pass

    @classmethod
    def unregister(cls):
        pass


class FakeRequest:
    def __init__(self, method, params=None, view=None):
        self.method = method
        self.params = params
        self.view = view


class FakeLspTextCommand:
    def __init__(self, view):
        self.view = view

    def session_by_name(self, _name):
        return self.view.session


class FakeSession:
    def __init__(self, result):
        self.result = result
        self.request = None

    def send_request(self, request, on_result, _on_error=None):
        self.request = request
        on_result(self.result)


class FakeRuntimeManager:
    def __init__(self):
        self.started = None
        self.controls = []
        self.shown = []
        self.breakpoints = []
        self.captures = []
        self.crops = []
        self.recognition_tests = []
        self.shutdown_count = 0
        self.state = "idle"
        self.history = []

    def start(self, project, window):
        self.started = (project, window)

    def control(self, method):
        self.controls.append(method)

    def show_status(self, window):
        self.shown.append(("status", window))

    def show_latest_detail(self, window):
        self.shown.append(("detail", window))

    def set_breakpoints(self, tasks):
        self.breakpoints.append(tasks)

    def capture(self, window):
        self.captures.append(window)

    def crop(self, window, rect):
        self.crops.append((window, rect))

    def test_ocr(self, window):
        self.recognition_tests.append(("ocr", window))

    def test_template_match(self, window, template):
        self.recognition_tests.append(("template", window, template))

    def test_pipeline_recognition(self, window, task):
        self.recognition_tests.append(("pipeline", window, task))

    def fetch_versions(self, _window, callback):
        callback(["5.12.2", "5.11.0"], {"5.11.0"})

    def shutdown(self):
        self.shutdown_count += 1


class FakeLogAnalyzerManager:
    def __init__(self):
        self.calls = []

    def inspect(self, project, window):
        self.calls.append(("inspect", project, window))

    def open_web(self, project):
        self.calls.append(("web", project))


class FakeNodeRunner:
    def node_env(self):
        return {"NODE_TEST_RUNTIME": "1"}

    def node_binary_path(self):
        return Path("managed-node")

    def resolve_version(self):
        return "24.0.0"

    def npm_command(self):
        return ["managed-node", "npm-cli.js"]


class FakeNodeManager:
    calls = []

    @classmethod
    def resolve(cls, package_name, requirement):
        cls.calls.append((package_name, requirement))
        return FakeNodeRunner()


class FakeWindowCommand:
    def __init__(self, window):
        self.window = window


class FakeEventListener:
    pass


class FakeView:
    def __init__(self, file_name, window=None):
        self._file_name = file_name
        self._window = window
        self.statuses = {}
        self.session = None
        self.name = None
        self.scratch = False
        self.syntax = None
        self.content = ""
        self.read_only = False
        self._settings = FakeSettings()

    def file_name(self):
        return self._file_name

    def window(self):
        return self._window

    def set_status(self, key, value):
        self.statuses[key] = value

    def settings(self):
        return self._settings

    def erase_status(self, key):
        self.statuses.pop(key, None)

    def set_name(self, name):
        self.name = name

    def set_scratch(self, scratch):
        self.scratch = scratch

    def assign_syntax(self, syntax):
        self.syntax = syntax

    def run_command(self, command, args):
        if command == "append":
            self.content += args["characters"]

    def set_read_only(self, read_only):
        self.read_only = read_only


class FakeHtmlSheet:
    def __init__(self, name, content):
        self.name = name
        self.content = content

    def set_contents(self, content):
        self.content = content


class FakeWindow:
    next_id = 1

    def __init__(self, folders):
        self._folders = folders
        self.labels = []
        self.on_done = None
        self._views = []
        self.opened = None
        self.ran_command = None
        self.html_sheet = None
        self.input_values = []
        self._id = FakeWindow.next_id
        FakeWindow.next_id += 1

    def folders(self):
        return self._folders

    def show_quick_panel(self, labels, on_done):
        self.labels = labels
        self.on_done = on_done

    def views(self):
        return self._views

    def active_view(self):
        return self._views[0] if self._views else None

    def open_file(self, file_name, flags=0):
        self.opened = (file_name, flags)

    def show_input_panel(self, _caption, initial, on_done, _on_change, _on_cancel):
        on_done(self.input_values.pop(0) if self.input_values else initial)

    def new_file(self):
        view = FakeView(None, self)
        self._views.append(view)
        return view

    def run_command(self, command, args=None):
        self.ran_command = (command, args)

    def id(self):
        return self._id

    def new_html_sheet(self, name, content):
        self.html_sheet = FakeHtmlSheet(name, content)
        return self.html_sheet


class FakeSublime(types.ModuleType):
    def __init__(self, cache):
        super().__init__("sublime")
        self.cache = cache
        self.settings = FakeSettings()
        self.server = b"first"
        self.messages = []
        self.clipboard = None

    def load_settings(self, _name):
        return self.settings

    def load_binary_resource(self, _name):
        return self.server

    def cache_path(self):
        return self.cache

    def status_message(self, message):
        self.messages.append(message)

    def set_timeout(self, callback, _delay=0):
        callback()

    def set_timeout_async(self, callback, _delay=0):
        callback()

    def version(self):
        return "4200"

    def find_resources(self, pattern):
        return ["Packages/LSP/LSP.sublime-settings"] if pattern == "LSP.sublime-settings" else []

    def save_settings(self, _name):
        pass

    def set_clipboard(self, value):
        self.clipboard = value

    def command_url(self, command, _args=None):
        return f"subl:{command}"


class PluginTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.sublime = FakeSublime(str(Path(self.temp.name, "cache")))
        self.plugin_storage = Path(self.temp.name, "package-storage", "LSP-MaaFramework")
        FakeLspPlugin.plugin_storage_path = self.plugin_storage
        self.sublime.ENCODED_POSITION = 1
        lsp = types.ModuleType("LSP")
        lsp_plugin = types.ModuleType("LSP.plugin")
        lsp_plugin.LspPlugin = FakeLspPlugin
        lsp_plugin.LspTextCommand = FakeLspTextCommand
        lsp_plugin.IsApplicableContext = object
        lsp_plugin.OnPreStartContext = object
        lsp_plugin.PluginStartError = RuntimeError
        lsp_plugin.Request = FakeRequest
        lsp_plugin.filename_to_uri = lambda file: Path(file).as_uri()

        def parse_uri(uri):
            parsed = urlparse(uri)
            path = unquote(parsed.path)
            if len(path) >= 3 and path[0] == "/" and path[2] == ":":
                path = path[1:]
            return parsed.scheme, path

        lsp_plugin.parse_uri = parse_uri
        lsp_utils = types.ModuleType("lsp_utils")
        lsp_utils.NodeManager = FakeNodeManager
        sublime_plugin = types.ModuleType("sublime_plugin")
        sublime_plugin.WindowCommand = FakeWindowCommand
        sublime_plugin.EventListener = FakeEventListener
        sys.modules["sublime"] = self.sublime
        sys.modules["sublime_plugin"] = sublime_plugin
        sys.modules["LSP"] = lsp
        sys.modules["LSP.plugin"] = lsp_plugin
        sys.modules["lsp_utils"] = lsp_utils
        FakeNodeManager.calls.clear()

        source = Path(__file__).with_name("plugin.py")
        spec = importlib.util.spec_from_file_location("maalsp_plugin_test", source)
        self.plugin = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.plugin)

    def tearDown(self):
        sys.modules.pop("sublime", None)
        sys.modules.pop("sublime_plugin", None)
        sys.modules.pop("LSP", None)
        sys.modules.pop("LSP.plugin", None)
        sys.modules.pop("lsp_utils", None)
        self.temp.cleanup()

    def test_extracts_and_refreshes_packaged_server(self):
        target = self.plugin.LspMaaFrameworkPlugin._extract_packaged_server()
        self.assertEqual(target.parent, self.plugin_storage)
        self.assertEqual(target.read_bytes(), b"first")

        self.sublime.server = b"second"
        target = self.plugin.LspMaaFrameworkPlugin._extract_packaged_server()
        self.assertEqual(target.read_bytes(), b"second")

    def test_selects_python_38_plugin_host(self):
        version = Path(__file__).with_name(".python-version").read_text(encoding="utf-8").strip()
        self.assertEqual(version, "3.8")

    def test_uses_package_control_helper_name(self):
        self.assertEqual(self.plugin.PACKAGE_NAME, "LSP-MaaFramework")
        self.assertEqual(
            self.plugin.SERVER_RESOURCE,
            "Packages/LSP-MaaFramework/server.mjs",
        )

    def test_resolves_managed_node_runtime_before_start(self):
        server = Path(self.temp.name, "custom-server.mjs")
        server.write_text("", encoding="utf-8")
        self.sublime.settings.values["server_path"] = "ignored-user-setting.mjs"
        window = FakeWindow([self.temp.name])
        context = types.SimpleNamespace(
            configuration=types.SimpleNamespace(
                env={},
                root_settings={
                    "server_path": str(server),
                    "maa_version": "5.11.0",
                },
            ),
            variables={},
            view=FakeView(str(server), window),
        )

        self.plugin.LspMaaFrameworkPlugin.on_pre_start_async(context)

        self.assertEqual(
            FakeNodeManager.calls,
            [("LSP-MaaFramework", ">=20.19.0")],
        )
        self.assertEqual(context.variables["node_bin"], "managed-node")
        self.assertEqual(context.variables["server_path"], str(server))
        self.assertEqual(context.configuration.env, {"NODE_TEST_RUNTIME": "1"})
        self.assertEqual(
            self.plugin._settings_for_window(window)["maa_version"],
            "5.11.0",
        )

    def test_embeds_local_png_in_hover_while_preserving_file_link(self):
        image = Path(self.temp.name, "image with space.png")
        image.write_bytes(b"\x89PNG\r\n\x1a\npreview")
        uri = image.as_uri()
        result = {
            "contents": {
                "kind": "markdown",
                "value": f"[image.png]({uri})\n\n![]({uri})",
            }
        }

        self.plugin.LspMaaFrameworkPlugin().on_server_response_async(
            {"method": "textDocument/hover", "result": result}
        )

        value = result["contents"]["value"]
        self.assertIn(f"[image.png]({uri})", value)
        self.assertIn("![](data:image/png;base64,", value)
        self.assertNotIn(f"![]({uri})", value)

    def test_only_applies_to_workspaces_with_recursive_interface(self):
        workspace = Path(self.temp.name, "workspace")
        nested = workspace / "apps" / "maa"
        nested.mkdir(parents=True)
        (nested / "interface.jsonc").write_text("{}", encoding="utf-8")
        view = types.SimpleNamespace(file_name=lambda: str(nested / "pipeline.json"))
        context = types.SimpleNamespace(
            base_applicable=True,
            configuration=types.SimpleNamespace(root_settings={}),
            workspace_folders=[types.SimpleNamespace(path=str(workspace))],
            view=view,
        )

        self.assertTrue(self.plugin.LspMaaFrameworkPlugin.is_applicable_async(context))

    def test_rejects_generic_json_workspace_and_base_selector_mismatch(self):
        workspace = Path(self.temp.name, "generic")
        workspace.mkdir()
        for ignored in (".hidden", "node_modules", "MaaUtils", "MaaDeps"):
            ignored_directory = workspace / ignored
            ignored_directory.mkdir()
            (ignored_directory / "interface.json").write_text("{}", encoding="utf-8")
        view = types.SimpleNamespace(file_name=lambda: str(workspace / "data.json"))
        generic_context = types.SimpleNamespace(
            base_applicable=True,
            configuration=types.SimpleNamespace(root_settings={}),
            workspace_folders=[types.SimpleNamespace(path=str(workspace))],
            view=view,
        )
        selector_context = types.SimpleNamespace(
            base_applicable=False,
            configuration=types.SimpleNamespace(root_settings={}),
            workspace_folders=[],
            view=view,
        )

        self.assertFalse(self.plugin.LspMaaFrameworkPlugin.is_applicable_async(generic_context))
        self.assertFalse(self.plugin.LspMaaFrameworkPlugin.is_applicable_async(selector_context))

    def test_selects_interface_values_and_preserves_existing_config(self):
        workspace = Path(self.temp.name, "workspace")
        project = workspace / "apps" / "demo"
        project.mkdir(parents=True)
        (project / "interface.jsonc").write_text(
            """
            {
                // Project choices may use JSONC.
                "controller": [{ "name": "Adb" },],
                "resource": [
                    { "name": "Default", "path": "resource" },
                    { "name": "Extra", "path": "extra" },
                ],
                "languages": {
                    "English": "lang/en.json",
                    "Chinese": "lang/zh.json",
                },
            }
            """,
            encoding="utf-8",
        )
        config_file = project / "config" / "maa_pi_config.json"
        config_file.parent.mkdir()
        config_file.write_text(
            '{"controller":"Old","task":[{"name":"Keep"}]}',
            encoding="utf-8",
        )
        window = FakeWindow([str(workspace)])

        resource = self.plugin.MaaFrameworkSelectResourceCommand(window)
        resource.run()
        project_label = str(Path("apps", "demo"))
        self.assertEqual(
            window.labels,
            [f"{project_label} — Default", f"{project_label} — Extra"],
        )
        window.on_done(1)

        locale = self.plugin.MaaFrameworkSelectLocaleCommand(window)
        locale.run()
        self.assertEqual(
            window.labels,
            [f"{project_label} — English", f"{project_label} — Chinese"],
        )
        window.on_done(1)

        config = json.loads(config_file.read_text(encoding="utf-8"))
        self.assertEqual(config["resource"], "Extra")
        self.assertEqual(config["__locale"], "Chinese")
        self.assertEqual(config["controller"], "Old")
        self.assertEqual(config["task"], [{"name": "Keep"}])
        self.assertIn("MaaFramework: selected resource Extra", self.sublime.messages)
        self.assertIn("MaaFramework: selected locale Chinese", self.sublime.messages)

    def test_does_not_overwrite_invalid_project_config(self):
        workspace = Path(self.temp.name, "workspace")
        project = workspace / "demo"
        config_file = project / "config" / "maa_pi_config.json"
        config_file.parent.mkdir(parents=True)
        (project / "interface.json").write_text(
            '{"resource":[{"name":"Default"}]}',
            encoding="utf-8",
        )
        config_file.write_text("{ invalid", encoding="utf-8")
        window = FakeWindow([str(workspace)])

        command = self.plugin.MaaFrameworkSelectResourceCommand(window)
        command.run()
        window.on_done(0)

        self.assertEqual(config_file.read_text(encoding="utf-8"), "{ invalid")
        self.assertIn(
            f"MaaFramework: cannot update invalid config {config_file}",
            self.sublime.messages,
        )

    def test_shows_active_project_and_resource_in_view_status(self):
        project = Path(self.temp.name, "workspace", "demo")
        pipeline = project / "pipeline" / "main.json"
        pipeline.parent.mkdir(parents=True)
        pipeline.write_text("{}", encoding="utf-8")
        (project / "interface.json").write_text(
            """
            {
                "name": "Demo Project",
                "resource": [
                    { "name": "Default" },
                    { "name": "Extra" }
                ]
            }
            """,
            encoding="utf-8",
        )
        config = project / "config" / "maa_pi_config.json"
        config.parent.mkdir()
        config.write_text(
            '{"resource":"Extra","controller":"Adb","__locale":"Chinese"}',
            encoding="utf-8",
        )
        view = FakeView(str(pipeline))

        self.plugin.MaaFrameworkProjectStatusListener().on_activated_async(view)

        self.assertEqual(
            view.statuses[self.plugin.STATUS_KEY],
            "MaaFramework: Demo Project · resource: Extra · controller: Adb · locale: Chinese",
        )
        self.assertTrue(view.settings().get(self.plugin.STATUS_KEY))

        generic = FakeView(str(Path(self.temp.name, "generic.json")))
        generic.statuses[self.plugin.STATUS_KEY] = "stale"
        self.plugin.MaaFrameworkProjectStatusListener().on_load_async(generic)
        self.assertNotIn(self.plugin.STATUS_KEY, generic.statuses)
        self.assertIsNone(generic.settings().get(self.plugin.STATUS_KEY))

    def test_goes_to_task_in_active_resource(self):
        project = Path(self.temp.name, "workspace", "demo")
        pipeline = project / "resource" / "pipeline" / "main.jsonc"
        pipeline.parent.mkdir(parents=True)
        pipeline.write_text(
            """
            {
                // Only top-level keys are tasks.
                "Alpha": {
                    "next": ["Beta"],
                    "nested": { "NotATask": true }
                },
                "$Internal": {},
                "Beta": {}
            }
            """,
            encoding="utf-8",
        )
        (project / "interface.json").write_text(
            '{"resource":[{"name":"Default","path":["resource"]}]}',
            encoding="utf-8",
        )
        window = FakeWindow([str(project.parent)])
        window._views.append(FakeView(str(pipeline), window))

        command = self.plugin.MaaFrameworkGotoTaskCommand(window)
        command.run()

        pipeline_label = str(Path("resource", "pipeline", "main.jsonc"))
        self.assertEqual(
            window.labels,
            [
                f"Alpha — {pipeline_label}:4",
                f"Beta — {pipeline_label}:9",
            ],
        )
        window.on_done(1)
        self.assertEqual(
            window.opened,
            (f"{pipeline}:9:1", self.sublime.ENCODED_POSITION),
        )

    def test_evaluates_task_with_language_server_into_scratch_json(self):
        project = Path(self.temp.name, "workspace", "demo")
        pipeline = project / "resource" / "pipeline" / "main.json"
        pipeline.parent.mkdir(parents=True)
        pipeline.write_text('{"Entry":{"timeout":1234}}', encoding="utf-8")
        (project / "interface.json").write_text(
            '{"resource":[{"name":"Default","path":"resource"}]}',
            encoding="utf-8",
        )
        window = FakeWindow([str(project.parent)])
        source = FakeView(str(pipeline), window)
        source.session = FakeSession({"timeout": 1234, "next": ["Done"]})
        window._views.append(source)

        command = self.plugin.MaaFrameworkEvaluateTaskCommand(source)
        command.run(None)
        self.assertEqual(window.labels, ["Entry"])
        window.on_done(0)

        self.assertEqual(source.session.request.method, "maa/evaluateTask")
        self.assertEqual(
            source.session.request.params,
            {"uri": pipeline.as_uri(), "task": "Entry"},
        )
        output = window._views[-1]
        self.assertEqual(output.name, "MaaFramework Eval — Entry.json")
        self.assertTrue(output.scratch)
        self.assertEqual(output.syntax, "Packages/JSON/JSON.sublime-syntax")
        self.assertTrue(output.read_only)
        self.assertEqual(json.loads(output.content), {"timeout": 1234, "next": ["Done"]})

    def test_manually_reloads_projects_and_config(self):
        window = FakeWindow([self.temp.name])
        source = FakeView(str(Path(self.temp.name, "interface.json")), window)
        source.session = FakeSession({"projects": 2})
        window._views.append(source)

        command = self.plugin.MaaFrameworkReloadCommand(source)
        command.run(None)

        self.assertEqual(source.session.request.method, "maa/reloadProjects")
        self.assertEqual(source.session.request.params, {})
        self.assertIn(
            "MaaFramework: reloaded 2 interface projects",
            self.sublime.messages,
        )

    def test_reports_a_complete_working_environment(self):
        workspace = Path(self.temp.name, "workspace")
        workspace.mkdir()
        (workspace / "interface.jsonc").write_text(
            '{"resource":[{"name":"Default","path":"resource"}]}',
            encoding="utf-8",
        )
        config = workspace / "config" / "maa_pi_config.json"
        config.parent.mkdir()
        config.write_text('{"resource":"Default"}', encoding="utf-8")
        server = Path(self.temp.name, "server.mjs")
        server.write_text("", encoding="utf-8")
        window = FakeWindow([str(workspace)])
        self.plugin._effective_settings_by_window[window.id()] = {
            **self.plugin.PLUGIN_DEFAULTS,
            "server_path": str(server),
        }

        self.plugin.MaaFrameworkCheckEnvironmentCommand(window).run()

        output = window._views[-1]
        self.assertEqual(output.name, "LSP-MaaFramework Environment Check")
        self.assertIn("[OK] Sublime Text build 4200", output.content)
        self.assertIn("[OK] LSP package is installed", output.content)
        self.assertIn("[OK] Node.js 24.0.0: managed-node", output.content)
        self.assertIn("[OK] discovered 1 interface project(s)", output.content)
        self.assertTrue(output.content.endswith("Result: PASS\n"))
        self.assertTrue(output.read_only)

    def test_control_panel_adds_and_removes_persistent_queue_tasks(self):
        project = Path(self.temp.name, "workspace", "demo")
        pipeline = project / "resource" / "pipeline" / "main.json"
        pipeline.parent.mkdir(parents=True)
        pipeline.write_text('{"Entry":{}}', encoding="utf-8")
        (project / "interface.json").write_text(
            """
            {
                "resource": [{ "name": "Default", "path": "resource" }],
                "task": [{ "name": "Daily", "entry": "Entry" }]
            }
            """,
            encoding="utf-8",
        )
        config_file = project / "config" / "maa_pi_config.json"
        config_file.parent.mkdir()
        config_file.write_text('{"resource":"Default","task":[]}', encoding="utf-8")
        window = FakeWindow([str(project.parent)])
        window._views.append(FakeView(str(pipeline), window))

        add = self.plugin.MaaFrameworkAddTaskCommand(window)
        add.run()
        self.assertEqual(window.labels, ["Daily — Entry"])
        window.on_done(0)
        config = json.loads(config_file.read_text(encoding="utf-8"))
        self.assertEqual(config["task"][0]["name"], "Daily")
        self.assertTrue(config["task"][0]["__key"])

        panel = self.plugin.MaaFrameworkControlPanelCommand(window)
        panel.run()
        self.assertEqual(
            window.labels,
            [
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
                "Analyze Maa Logs…",
                "MaaLogAnalyzer…",
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
                "Queue 1: Daily",
            ],
        )
        window.on_done(22)
        self.assertEqual(window.ran_command, ("maa_framework_add_task", None))

        remove = self.plugin.MaaFrameworkRemoveTaskCommand(window)
        remove.run()
        self.assertEqual(window.labels, ["Queue 1: Daily"])
        window.on_done(0)
        config = json.loads(config_file.read_text(encoding="utf-8"))
        self.assertEqual(config["task"], [])

    def test_starts_and_controls_native_task_queue(self):
        project = Path(self.temp.name, "workspace", "demo")
        pipeline = project / "resource" / "pipeline" / "main.json"
        pipeline.parent.mkdir(parents=True)
        pipeline.write_text('{"Entry":{}}', encoding="utf-8")
        (project / "interface.json").write_text(
            '{"resource":[{"name":"Default","path":"resource"}]}',
            encoding="utf-8",
        )
        config = project / "config" / "maa_pi_config.json"
        config.parent.mkdir()
        config.write_text('{"task":[{"name":"Daily"}]}', encoding="utf-8")
        window = FakeWindow([str(project.parent)])
        window._views.append(FakeView(str(pipeline), window))
        runtime = FakeRuntimeManager()
        self.plugin._runtime_manager = runtime

        self.plugin.MaaFrameworkStartCommand(window).run()
        self.plugin.MaaFrameworkPauseCommand(window).run()
        self.plugin.MaaFrameworkContinueCommand(window).run()
        self.plugin.MaaFrameworkStopCommand(window).run()
        self.plugin.MaaFrameworkStopAgentsCommand(window).run()
        self.plugin.MaaFrameworkRuntimeStatusCommand(window).run()
        self.plugin.MaaFrameworkRuntimeDetailCommand(window).run()
        self.plugin.MaaFrameworkScreenshotCommand(window).run()
        window.input_values = ["10", "20", "100", "80"]
        self.plugin.MaaFrameworkCropScreenshotCommand(window).run()
        self.plugin.MaaFrameworkTestOcrCommand(window).run()

        template = project / "template.png"
        template.write_bytes(b"png")
        window.input_values = [str(template)]
        self.plugin.MaaFrameworkTestTemplateMatchCommand(window).run()

        recognition = self.plugin.MaaFrameworkTestPipelineRecognitionCommand(window)
        recognition.run()
        self.assertEqual(window.labels, ["Entry"])
        window.on_done(0)

        self.assertEqual(runtime.started, (project, window))
        self.assertEqual(runtime.controls, ["pause", "continue", "stop", "stopAgents"])
        self.assertEqual(runtime.shown, [("status", window), ("detail", window)])
        self.assertEqual(runtime.captures, [window])
        self.assertEqual(runtime.crops, [(window, [10, 20, 100, 80])])
        self.assertEqual(
            runtime.recognition_tests,
            [
                ("ocr", window),
                ("template", window, template),
                ("pipeline", window, "Entry"),
            ],
        )

    def test_toggles_project_task_breakpoints_and_syncs_runtime(self):
        project = Path(self.temp.name, "workspace", "demo")
        pipeline = project / "resource" / "pipeline" / "main.json"
        pipeline.parent.mkdir(parents=True)
        pipeline.write_text('{"Alpha":{},"Beta":{}}', encoding="utf-8")
        (project / "interface.json").write_text(
            '{"resource":[{"name":"Default","path":"resource"}]}',
            encoding="utf-8",
        )
        window = FakeWindow([str(project.parent)])
        window._views.append(FakeView(str(pipeline), window))
        runtime = FakeRuntimeManager()
        self.plugin._runtime_manager = runtime

        command = self.plugin.MaaFrameworkBreakpointsCommand(window)
        command.run()
        self.assertEqual(window.labels, ["○ Alpha", "○ Beta"])
        window.on_done(1)

        self.assertEqual(self.plugin._break_tasks(project, window), ["Beta"])
        self.assertEqual(runtime.breakpoints, [["Beta"]])

    def test_selects_native_version_and_registry(self):
        window = FakeWindow([self.temp.name])
        runtime = FakeRuntimeManager()
        self.plugin._runtime_manager = runtime

        version = self.plugin.MaaFrameworkSelectVersionCommand(window)
        version.run()
        self.assertEqual(
            window.labels,
            ["5.12.2 — in use", "5.11.0 — installed"],
        )
        window.on_done(1)
        self.assertEqual(self.sublime.settings.get("maa_version"), "5.11.0")
        self.assertEqual(runtime.shutdown_count, 1)

        registry = self.plugin.MaaFrameworkSelectRegistryCommand(window)
        registry.run()
        self.assertEqual(
            window.labels,
            [
                "npm — https://registry.npmjs.org (in use)",
                "cnpm — https://registry.npmmirror.com",
            ],
        )
        window.on_done(1)
        self.assertEqual(
            self.sublime.settings.get("npm_registry"),
            "https://registry.npmmirror.com",
        )

    def test_filters_and_orders_supported_native_versions(self):
        versions = ["5.12.2-beta.2", "5.4.9", "invalid", "5.12.2", "5.12.2-beta.10"]
        filtered = [
            version for version in versions if self.plugin._maa_version_key(version) is not None
        ]
        filtered.sort(key=self.plugin._maa_version_key, reverse=True)
        self.assertEqual(
            filtered,
            ["5.12.2", "5.12.2-beta.10", "5.12.2-beta.2"],
        )

    def test_toggles_admin_debug_and_recognition_drawing_modes(self):
        window = FakeWindow([self.temp.name])
        runtime = FakeRuntimeManager()
        self.plugin._runtime_manager = runtime

        self.plugin.MaaFrameworkToggleAdminCommand(window).run()
        self.plugin.MaaFrameworkToggleDebugCommand(window).run()
        self.plugin.MaaFrameworkToggleSaveDrawCommand(window).run()

        self.assertTrue(self.sublime.settings.get("admin_mode"))
        self.assertFalse(self.sublime.settings.get("debug_mode"))
        self.assertTrue(self.sublime.settings.get("save_draw"))
        self.assertEqual(runtime.shutdown_count, 3)

    def test_routes_global_shortcuts_to_activated_window(self):
        target = FakeWindow([self.temp.name])
        source = FakeWindow([self.temp.name])
        runtime = FakeRuntimeManager()
        runtime.state = "paused"
        self.plugin._runtime_manager = runtime
        self.plugin._shortcut_controller = self.plugin.MaaShortcutController()

        self.plugin.MaaFrameworkActivateShortcutsCommand(target).run()
        self.plugin.MaaFrameworkShortcutStartCommand(source).run()
        self.assertEqual(target.ran_command, ("maa_framework_start", None))
        self.plugin.MaaFrameworkShortcutTogglePauseCommand(source).run()
        self.plugin.MaaFrameworkShortcutStopCommand(source).run()
        self.plugin.MaaFrameworkShortcutScreenshotCommand(source).run()

        self.assertEqual(runtime.controls, ["continue", "stop"])
        self.assertEqual(target.ran_command, ("maa_framework_screenshot", None))

    def test_opens_browser_execution_panel_with_sublime_ipc_links(self):
        window = FakeWindow([self.temp.name])
        runtime = FakeRuntimeManager()
        runtime.state = "running"
        self.plugin._runtime_manager = runtime
        self.plugin._control_sheets.clear()

        self.plugin.MaaFrameworkBrowserPanelCommand(window).run()

        self.assertEqual(window.html_sheet.name, "MaaFramework Control")
        self.assertIn("Runtime: <b>running</b>", window.html_sheet.content)
        self.assertIn('href="subl:maa_framework_start"', window.html_sheet.content)
        self.assertIn('href="subl:maa_framework_stop"', window.html_sheet.content)
        self.assertIn('href="subl:maa_framework_test_ocr"', window.html_sheet.content)
        self.assertIs(self.plugin._control_sheets[window.id()], window.html_sheet)

    def test_analyzes_maa_log_levels_and_events_in_html_sheet(self):
        project = Path(self.temp.name, "workspace", "demo")
        pipeline = project / "resource" / "pipeline" / "main.json"
        pipeline.parent.mkdir(parents=True)
        pipeline.write_text('{"Entry":{}}', encoding="utf-8")
        (project / "interface.json").write_text(
            '{"resource":[{"name":"Default","path":"resource"}]}',
            encoding="utf-8",
        )
        log = project / "debug" / "maafw.log"
        log.parent.mkdir()
        log.write_text(
            "\n".join(
                [
                    "[2026-08-08 10:00:00.000][INF][Tasker.cpp] [msg=Tasker.Task.Starting] [entry=Entry]",
                    "[2026-08-08 10:00:01.000][WRN][Pipeline.cpp] retry node",
                    "[2026-08-08 10:00:02.000][ERR][Tasker.cpp] [msg=Tasker.Task.Failed] [entry=Entry]",
                ]
            ),
            encoding="utf-8",
        )
        window = FakeWindow([str(project.parent)])
        window._views.append(FakeView(str(pipeline), window))
        self.plugin._log_sheets.clear()

        analysis = self.plugin._analyze_maa_log(log)
        self.assertEqual(analysis["counts"]["INF"], 1)
        self.assertEqual(analysis["counts"]["WRN"], 1)
        self.assertEqual(analysis["counts"]["ERR"], 1)
        self.assertEqual(analysis["events"][0], ("Tasker.Task.Failed", 1))

        self.plugin.MaaFrameworkAnalyzeLogsCommand(window).run(level="warning")
        self.assertEqual(window.html_sheet.name, "MaaFramework Log Analysis")
        self.assertIn("WRN: 1", window.html_sheet.content)
        self.assertIn("ERR: 1", window.html_sheet.content)
        self.assertIn("retry node", window.html_sheet.content)
        self.assertNotIn("Tasker.Task.Starting]", window.html_sheet.content)
        self.assertIn("subl:maa_framework_open_log", window.html_sheet.content)

        self.plugin.MaaFrameworkOpenLogCommand(window).run(str(log))
        self.assertEqual(window.opened, (str(log.resolve()), 0))

    def test_routes_maa_log_analyzer_runtime_and_web_actions(self):
        project = Path(self.temp.name, "workspace", "demo")
        pipeline = project / "resource" / "pipeline" / "main.json"
        pipeline.parent.mkdir(parents=True)
        pipeline.write_text('{"Entry":{}}', encoding="utf-8")
        (project / "interface.json").write_text(
            '{"resource":[{"name":"Default","path":"resource"}]}',
            encoding="utf-8",
        )
        window = FakeWindow([str(project.parent)])
        window._views.append(FakeView(str(pipeline), window))
        analyzer = FakeLogAnalyzerManager()
        self.plugin._log_analyzer_manager = analyzer

        command = self.plugin.MaaFrameworkMaaLogAnalyzerCommand(window)
        command.run()
        self.assertEqual(
            window.labels,
            [
                ["Runtime Inspection", "Use the official MaaLogAnalyzer parser in Sublime"],
                ["Open Visual Analyzer", "https://mla.maafw.com"],
            ],
        )
        window.on_done(0)
        command.run()
        window.on_done(1)

        self.assertEqual(
            analyzer.calls,
            [("inspect", project, window), ("web", project)],
        )


if __name__ == "__main__":
    unittest.main()
