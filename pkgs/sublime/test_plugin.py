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
    def register(cls):
        pass

    @classmethod
    def unregister(cls):
        pass


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
        lsp_plugin.OnPreStartContext = object
        lsp_plugin.PluginStartError = RuntimeError
        sys.modules["sublime"] = self.sublime
        sys.modules["LSP"] = lsp
        sys.modules["LSP.plugin"] = lsp_plugin

        source = Path(__file__).with_name("plugin.py")
        spec = importlib.util.spec_from_file_location("maalsp_plugin_test", source)
        self.plugin = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.plugin)

    def tearDown(self):
        sys.modules.pop("sublime", None)
        sys.modules.pop("LSP", None)
        sys.modules.pop("LSP.plugin", None)
        self.temp.cleanup()

    def test_extracts_and_refreshes_packaged_server(self):
        target = self.plugin.MaaLspPlugin._extract_packaged_server()
        self.assertEqual(target.read_bytes(), b"first")

        self.sublime.server = b"second"
        target = self.plugin.MaaLspPlugin._extract_packaged_server()
        self.assertEqual(target.read_bytes(), b"second")

    def test_selects_python_38_plugin_host(self):
        version = Path(__file__).with_name(".python-version").read_text(encoding="utf-8").strip()
        self.assertEqual(version, "3.8")


if __name__ == "__main__":
    unittest.main()
