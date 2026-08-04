from __future__ import annotations

from pathlib import Path

import sublime
from LSP.plugin import LspPlugin
from LSP.plugin import OnPreStartContext
from LSP.plugin import PluginStartError

SETTINGS_FILE = "MaaLSP.sublime-settings"


class MaaLspPlugin(LspPlugin):
    """LSP helper package that launches the maa-lsp language server."""

    @classmethod
    def on_pre_start_async(cls, context: OnPreStartContext) -> None:
        server_path = cls._resolve_server_path()
        if server_path is None:
            raise PluginStartError(
                "maa-lsp: server.mjs not found. "
                "Run 'pnpm build' in the maa-support-sublime repo, "
                f"or set server_path in {SETTINGS_FILE}."
            )
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
        candidate = here / ".." / "maa-lsp" / "dist" / "server.mjs"
        if candidate.is_file():
            return candidate.resolve()
        return None


def plugin_loaded() -> None:
    MaaLspPlugin.register()


def plugin_unloaded() -> None:
    MaaLspPlugin.unregister()