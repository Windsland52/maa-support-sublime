from __future__ import annotations

import os
from pathlib import Path

import sublime
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
