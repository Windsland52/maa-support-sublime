from __future__ import annotations

from pathlib import Path

import sublime
from LSP.plugin import LspPlugin
from LSP.plugin import OnPreStartContext
from LSP.plugin import PluginStartError
from lsp_utils import NodeManager

SETTINGS_FILE = "LSP-MaaFramework.sublime-settings"
PACKAGE_NAME = "LSP-MaaFramework"
SERVER_FILE = "server.mjs"
SERVER_RESOURCE = f"Packages/{PACKAGE_NAME}/{SERVER_FILE}"
NODE_VERSION_REQUIREMENT = ">=20.19.0"


class LspMaaFrameworkPlugin(LspPlugin):
    """LSP helper package that launches the maa-lsp language server."""

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
