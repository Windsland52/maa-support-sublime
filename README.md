# maa-support-sublime (mss)

`LSP-MaaFramework` is a Sublime Text 4 LSP helper for developing MaaFramework pipeline and interface projects. It bundles a standalone language server and adds project selection, native runtime control, recognition tools, and log analysis to Sublime Text.

[中文说明](#中文说明)

## Features

- Diagnostics, completion, navigation, references, rename, formatting, symbols, Code Lens, Inlay Hints, Code Actions, document links/colors, and rich hover information for MaaFramework JSON/JSONC;
- recursive discovery of every interface project in multi-root workspaces, including unsaved editor buffers and hot reloads of `maatools.config.mts` and `maa_pi_config.json`;
- controller, resource, locale, project, and task selection, task evaluation, environment checks, and manual reloads;
- MaaFramework native task queues, runtime controls, breakpoints, Agents, version/registry management, runtime details, and optional global shortcuts;
- screenshot/cropping, OCR/template/pipeline recognition tests, built-in log analysis, and MaaLogAnalyzer integration;
- a self-contained `LSP-MaaFramework.sublime-package` that does not depend on this repository's `node_modules`.

Project discovery follows `maa-support-extension`: it recursively finds `interface.json` and `interface.jsonc` while skipping hidden directories, `node_modules`, `MaaUtils`, and `MaaDeps`. This plugin supports generic MaaFramework projects only; it does not implement MaaAssistantArknights-specific layouts, references, or expression evaluation.

## Installation and usage

See the [Sublime package guide](pkgs/sublime/README.md) for prerequisites, installation, configuration, and command usage.

## Development

```bash
pnpm install
uv sync --frozen
pnpm lint
pnpm test
pnpm package:sublime
```

Python development tools are managed by uv. The root `.python-version` selects Python 3.13, while the packaged Sublime plugin has its own `.python-version` selecting the editor's Python 3.8 plugin host.

The built package is written to `release/LSP-MaaFramework.sublime-package`.

## Upstream components

- LSP core: `@nekosu/maa-pipeline-manager`
- Reference implementation: `maa-support-extension`

---

## 中文说明

Sublime Text 插件 + maa-lsp，面向 MaaFramework pipeline 开发。

> ⚠️ 本文档由 AI 生成，主要用于辅助 AI 理解项目。内容可能与实际代码不同步，请注意甄别。

## 功能

- Maa pipeline/interface 的诊断、补全、跳转、引用、重命名、格式化、符号、Code Lens、Inlay Hint、Code Action、Document Link/Color 与完整 Hover；
- 递归发现多 workspace 中的所有 interface 项目，读取并热更新 `maatools.config.mts` 与 `maa_pi_config.json`，支持未保存的编辑器缓冲区；
- 项目、controller、resource、locale 和任务选择，以及任务求值、环境检查和手动重载；
- MaaFramework native 任务队列、暂停/继续/停止、断点、Agent、版本/registry、运行详情与全局快捷键；
- 浏览器式 minihtml 控制面板、截图/裁剪、OCR/模板/pipeline 识别测试、日志分析与 MaaLogAnalyzer 集成；
- 不依赖仓库 `node_modules`、可通过 Package Control 或 GitHub Release 安装的 `LSP-MaaFramework.sublime-package`。

资源发现与 `maa-support-extension` 对齐：递归查找 `interface.json` / `interface.jsonc`，跳过隐藏目录、`node_modules`、`MaaUtils` 和 `MaaDeps`。每个项目从 `config/maa_pi_config.json` 读取 controller/resource 选择。

本插件只实现 MaaFramework 通用逻辑，不包含 MaaAssistantArknights 的特殊目录、引用或表达式求值语义。

## 结构

- `pkgs/maa-lsp` — 可独立运行的 Node LSP server
- `pkgs/sublime` — Sublime Text LSP 插件
- `scripts/build-package.mjs` — 生成 Sublime 安装包
- `scripts/test-sublime-ui.ps1` — 在隔离的真实 Sublime 实例中执行 UI 冒烟测试
- `docs` — 实现状态、使用约束和 TODO

## 安装与使用

用户安装、配置和命令说明见 [`pkgs/sublime/README.md`](pkgs/sublime/README.md)。

## 开发

```bash
pnpm install
uv sync --frozen
pnpm lint
pnpm test
pnpm package:sublime
```

项目 Python 开发工具由 uv 管理：根目录 `.python-version` 固定开发环境 Python 3.13，`uv.lock` 锁定 Ruff 与 Package Control reviewer；`pnpm lint` / `pnpm test` 会通过 `uv run --frozen` 调用它们。Sublime 安装包内的 `.python-version` 独立固定为 3.8，这是编辑器 plugin host 约束，不属于 uv 虚拟环境。

安装包输出到 `release/LSP-MaaFramework.sublime-package`。开发态安装和用户安装方式见 [`pkgs/sublime/README.md`](pkgs/sublime/README.md)。

公开仓库：<https://github.com/Windsland52/maa-support-sublime>

## 上游

- LSP 核心：`@nekosu/maa-pipeline-manager`
- 对齐实现：`maa-support-extension`
