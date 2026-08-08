# Sublime 插件与分发

> ⚠️ 本文档由 AI 生成，主要用于辅助 AI 理解项目。内容可能与实际代码不同步，请注意甄别。

## 包内容

`pnpm package:sublime` 生成 `release/LSP-MaaFramework.sublime-package`。它是 ZIP 格式，包含：

- `.python-version`，固定为 `3.8`，确保插件与新版 LSP 运行在相同的 Sublime Python 宿主；
- `plugin.py`
- `LSP-MaaFramework.sublime-settings`
- `dependencies.json`
- 独立的 `server.mjs`
- README、LICENSE、第三方声明

构建脚本会拒绝非 `3.8` 的插件宿主声明和仍含第三方裸 import 的 `server.mjs`，并在写包后校验所有必需条目。缺少 `.python-version` 时，Sublime 会回退到 Python 3.3，导致插件无法导入运行于 Python 3.8 的新版 LSP。

## 运行方式

插件按以下优先级解析 LSP server：

1. 用户配置的 `server_path`；
2. 解包目录内的 `server.mjs`；
3. 开发仓库相邻的 `maa-lsp/dist/server.mjs`；
4. 从 `.sublime-package` 读取并写入 Sublime cache 的 `server.mjs`。

因此 GitHub Release、Package Control 和开发符号链接共用一份插件实现。

Node runtime 通过 `lsp_utils.NodeManager` 解析，要求 `>=20.19.0`。优先复用 PATH 中满足版本的 Node；找不到时由 `lsp_utils` 提供隔离下载，不修改系统 Node。

## 包名迁移

0.2.0 起公开包名从 `MaaLSP` 调整为 `LSP-MaaFramework`，以符合 Package Control 的 LSP helper 命名约定。Package Control 不会跨包名自动升级，0.1.x 用户需要移除旧包后安装新包。

## 自动化

- CI 在 Node 24 上执行 lint、LSP 黑盒测试、Python 插件测试和安装包构建；
- 推送 `v*` tag 时创建或更新 GitHub Release，并上传 `LSP-MaaFramework.sublime-package`；
- 根目录 `repository.json` 使用 schema 3 和显式 GitHub Release 下载地址，兼容 Package Control 3.4.1，允许用户在正式收录前通过 `Add Repository` 安装；
- Package Control 默认 channel 条目需在首个 Release 建立后另行提交。
