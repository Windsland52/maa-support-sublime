import importlib.util
import json
import sys
import tempfile
import types
import unittest
from pathlib import Path


class FakeSettings:
    def __init__(self):
        self.values = {"server_path": "auto"}

    def get(self, key):
        return self.values.get(key)


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


class FakeNodeRunner:
    def node_env(self):
        return {"NODE_TEST_RUNTIME": "1"}

    def node_binary_path(self):
        return Path("managed-node")


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

    def file_name(self):
        return self._file_name

    def window(self):
        return self._window

    def set_status(self, key, value):
        self.statuses[key] = value

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


class FakeWindow:
    def __init__(self, folders):
        self._folders = folders
        self.labels = []
        self.on_done = None
        self._views = []
        self.opened = None

    def folders(self):
        return self._folders

    def show_quick_panel(self, labels, on_done):
        self.labels = labels
        self.on_done = on_done

    def views(self):
        return self._views

    def active_view(self):
        return self._views[0] if self._views else None

    def open_file(self, file_name, flags):
        self.opened = (file_name, flags)

    def new_file(self):
        view = FakeView(None, self)
        self._views.append(view)
        return view


class FakeSublime(types.ModuleType):
    def __init__(self, cache):
        super().__init__("sublime")
        self.cache = cache
        self.settings = FakeSettings()
        self.server = b"first"
        self.messages = []

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


class PluginTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.sublime = FakeSublime(self.temp.name)
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
        self.sublime.settings.values["server_path"] = str(server)
        context = types.SimpleNamespace(
            configuration=types.SimpleNamespace(env={}),
            variables={},
        )

        self.plugin.LspMaaFrameworkPlugin.on_pre_start_async(context)

        self.assertEqual(
            FakeNodeManager.calls,
            [("LSP-MaaFramework", ">=20.19.0")],
        )
        self.assertEqual(context.variables["node_bin"], "managed-node")
        self.assertEqual(context.variables["server_path"], str(server))
        self.assertEqual(context.configuration.env, {"NODE_TEST_RUNTIME": "1"})

    def test_only_applies_to_workspaces_with_recursive_interface(self):
        workspace = Path(self.temp.name, "workspace")
        nested = workspace / "apps" / "maa"
        nested.mkdir(parents=True)
        (nested / "interface.jsonc").write_text("{}", encoding="utf-8")
        view = types.SimpleNamespace(file_name=lambda: str(nested / "pipeline.json"))
        context = types.SimpleNamespace(
            base_applicable=True,
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
            workspace_folders=[types.SimpleNamespace(path=str(workspace))],
            view=view,
        )
        selector_context = types.SimpleNamespace(
            base_applicable=False,
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
        self.assertEqual(
            window.labels,
            ["apps\\demo — Default", "apps\\demo — Extra"],
        )
        window.on_done(1)

        locale = self.plugin.MaaFrameworkSelectLocaleCommand(window)
        locale.run()
        self.assertEqual(
            window.labels,
            ["apps\\demo — English", "apps\\demo — Chinese"],
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

        generic = FakeView(str(Path(self.temp.name, "generic.json")))
        generic.statuses[self.plugin.STATUS_KEY] = "stale"
        self.plugin.MaaFrameworkProjectStatusListener().on_load_async(generic)
        self.assertNotIn(self.plugin.STATUS_KEY, generic.statuses)

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

        self.assertEqual(
            window.labels,
            [
                "Alpha — resource\\pipeline\\main.jsonc:4",
                "Beta — resource\\pipeline\\main.jsonc:9",
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


if __name__ == "__main__":
    unittest.main()
