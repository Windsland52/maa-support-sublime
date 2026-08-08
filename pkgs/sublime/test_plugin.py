import importlib.util
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


class FakeSublime(types.ModuleType):
    def __init__(self, cache):
        super().__init__("sublime")
        self.cache = cache
        self.settings = FakeSettings()
        self.server = b"first"

    def load_settings(self, _name):
        return self.settings

    def load_binary_resource(self, _name):
        return self.server

    def cache_path(self):
        return self.cache


class PluginTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.sublime = FakeSublime(self.temp.name)
        lsp = types.ModuleType("LSP")
        lsp_plugin = types.ModuleType("LSP.plugin")
        lsp_plugin.LspPlugin = FakeLspPlugin
        lsp_plugin.IsApplicableContext = object
        lsp_plugin.OnPreStartContext = object
        lsp_plugin.PluginStartError = RuntimeError
        lsp_utils = types.ModuleType("lsp_utils")
        lsp_utils.NodeManager = FakeNodeManager
        sys.modules["sublime"] = self.sublime
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


if __name__ == "__main__":
    unittest.main()
