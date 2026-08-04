# maa-support-sublime (mss)

Sublime Text 插件 + maa-lsp + 跨编辑器浏览器 UI，面向 MaaFramework pipeline 开发。

> ⚠️ 本文档由 AI 生成，主要用于辅助 AI 理解项目。内容可能与实际代码不同步，请注意甄别。

## 结构（拟定，待确认）

- `pkgs/maa-lsp` — Node LSP server（schema 校验 / 定义跳转 / 诊断），复用 `@nekosu/maa-pipeline-manager` + `@nekosu/maa-types`
- `pkgs/sublime` — Sublime Text 插件（Python）：拉起 maa-lsp、起本地 web 服务、开浏览器、IPC 桥
- `pkgs/web-server` — 本地 HTTP/WebSocket 服务，serve web-ui + 浏览器↔sublime IPC
- `pkgs/web-ui` — 浏览器 UI（Vue/TS）：执行面板 + mla 前端（复用 `@windsland52/maa-log-*`）

## 上游

- 执行层：`@nekosu/maa-server`
- LSP 核心：`@nekosu/maa-pipeline-manager` + `@nekosu/maa-types`
- mla 前端：`@windsland52/maa-log-*`
