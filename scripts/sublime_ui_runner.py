from __future__ import annotations

import json
import os
import sys
import traceback
from pathlib import Path

import sublime
import sublime_plugin
import mdpopups


RESULT = Path(os.environ["MAA_SUBLIME_UI_RESULT"])
PROJECT = Path(os.environ["MAA_SUBLIME_UI_PROJECT"])
attempt = 0


def _hover_image_renders(view) -> bool:
    plugin = sys.modules.get("LSP-MaaFramework.plugin")
    image = PROJECT / "resource/image/preview.png"
    if plugin is None or not image.is_file():
        return False
    uri = image.as_uri()
    result = {
        "contents": {
            "kind": "markdown",
            "value": f"[preview.png]({uri})\n\n![]({uri})",
        }
    }
    plugin._embed_hover_images(result)
    value = result["contents"]["value"]
    rendered = mdpopups.md2html(view, value)
    return "![](data:image/png;base64," in value and "data:image/png;base64," in rendered


def _code_lens_renders(view) -> bool:
    plugin = sys.modules.get("LSP-MaaFramework.plugin")
    plugin_class = getattr(plugin, "LspMaaFrameworkPlugin", None)
    session_name = getattr(plugin_class, "name", None)
    return isinstance(session_name, str) and bool(view.get_regions(f"lsp_code_lens.{session_name}"))


def _finish(checks: dict[str, object], error: str | None = None) -> None:
    payload = {
        "passed": error is None and all(bool(value) for value in checks.values()),
        "python": sys.version,
        "build": sublime.version(),
        "checks": checks,
        "error": error,
    }
    RESULT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    sublime.set_timeout(lambda: sublime.run_command("exit"), 300)


def _check_environment(window, checks: dict[str, object]) -> None:
    try:
        report = next(
            (
                view
                for view in window.views()
                if view.name() == "LSP-MaaFramework Environment Check"
            ),
            None,
        )
        checks["environment_report_created"] = report is not None
        if report is not None:
            content = report.substr(sublime.Region(0, report.size()))
            checks["environment_passed"] = "Result: PASS" in content
            checks["environment_found_interface"] = "discovered 1 interface project(s)" in content
        else:
            checks["environment_passed"] = False
            checks["environment_found_interface"] = False
        _finish(checks)
    except Exception:
        _finish(checks, traceback.format_exc())


def _check_sheets(window, view, control_created: bool) -> None:
    try:
        html_sheet_count = sum(isinstance(sheet, sublime.HtmlSheet) for sheet in window.sheets())
        checks: dict[str, object] = {
            "python_38_host": sys.version_info[:2] == (3, 8),
            "package_resource_loaded": bool(
                sublime.find_resources("LSP-MaaFramework.sublime-settings")
            ),
            "maa_project_setting": view.settings().get("maa_framework_project") is True,
            "maa_project_status": bool(view.get_status("maa_framework_project")),
            "control_html_sheet": control_created,
            "log_analysis_html_sheet": html_sheet_count >= 2,
            "hover_image_preview": _hover_image_renders(view),
            "code_lens_rendered": _code_lens_renders(view),
            "registered_maa_commands": [
                command.__name__
                for command in sublime_plugin.window_command_classes
                if command.__name__.startswith("MaaFramework")
            ],
            "loaded_maa_modules": [
                name for name in sys.modules if "MaaFramework" in name or "maa" in name.lower()
            ],
        }
        window.run_command("maa_framework_check_environment")
        sublime.set_timeout(lambda: _check_environment(window, checks), 1200)
    except Exception:
        _finish({}, traceback.format_exc())


def _open_log_analysis(window, view) -> None:
    try:
        control_created = any(isinstance(sheet, sublime.HtmlSheet) for sheet in window.sheets())
        window.run_command("maa_framework_analyze_logs")
        sublime.set_timeout(lambda: _check_sheets(window, view, control_created), 1200)
    except Exception:
        _finish({}, traceback.format_exc())


def _exercise_commands(window, view) -> None:
    try:
        window.run_command("maa_framework_browser_panel")
        sublime.set_timeout(lambda: _open_log_analysis(window, view), 600)
    except Exception:
        _finish({}, traceback.format_exc())


def _wait_for_plugin() -> None:
    global attempt
    attempt += 1
    window = sublime.active_window()
    view = window.active_view() if window else None
    fixture_file = PROJECT / "resource/pipeline/main.json"
    if window is not None and attempt == 1:
        if str(PROJECT) not in window.folders():
            window.set_project_data({"folders": [{"path": str(PROJECT)}]})
        window.open_file(str(fixture_file))
        sublime.set_timeout(_wait_for_plugin, 500)
        return
    ready = (
        window is not None
        and view is not None
        and view.file_name() is not None
        and Path(view.file_name()).resolve() == fixture_file.resolve()
        and bool(sublime.find_resources("LSP-MaaFramework.sublime-settings"))
        and attempt >= 4
    )
    if ready:
        _exercise_commands(window, view)
    elif attempt < 40:
        sublime.set_timeout(_wait_for_plugin, 500)
    else:
        console = window.find_output_panel("console") if window else None
        console_text = (
            console.substr(sublime.Region(max(0, console.size() - 8000), console.size()))
            if console
            else ""
        )
        _finish(
            {
                "window_ready": window is not None,
                "fixture_view_ready": view is not None and view.file_name() is not None,
                "active_file": view.file_name() if view else None,
                "open_files": [candidate.file_name() for candidate in window.views()]
                if window
                else [],
                "package_resource_loaded": bool(
                    sublime.find_resources("LSP-MaaFramework.sublime-settings")
                ),
                "maa_project_setting": bool(
                    view and view.settings().get("maa_framework_project") is True
                ),
                "console_tail": console_text,
            },
            "Timed out waiting for LSP-MaaFramework to load in Sublime Text",
        )


def plugin_loaded() -> None:
    sublime.set_timeout(_wait_for_plugin, 1000)
