# maa-support-sublime (mss)

Sublime Text 插件 + maa-lsp，面向 MaaFramework pipeline 开发。

> ⚠️ 本文档由 AI 生成，主要用于辅助 AI 理解项目。内容可能与实际代码不同步，请注意甄别。

## 当前 MVP

- Maa pipeline/interface 诊断
- task、anchor、ROI、locale 引用的定义跳转
- task 定义和合并结果的悬停预览
- 支持未保存的编辑器缓冲区
- 递归发现所有 workspace folder 中的 Maa interface 项目
- 可直接安装的 `LSP-MaaFramework.sublime-package`

资源发现与 `maa-support-extension` 对齐：递归查找 `interface.json` / `interface.jsonc`，跳过隐藏目录、`node_modules`、`MaaUtils` 和 `MaaDeps`。每个项目从 `config/maa_pi_config.json` 读取 controller/resource 选择。

## 结构

- `pkgs/maa-lsp` — 可独立运行的 Node LSP server
- `pkgs/sublime` — Sublime Text LSP 插件
- `scripts/build-package.mjs` — 生成 Sublime 安装包
- `docs` — 实现状态、使用约束和 TODO

浏览器执行面板、日志 UI 和 Sublime IPC 不在当前 MVP 范围内。

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
