# MaaLSP (Sublime Text plugin)

Sublime Text LSP 插件，通过社区 [LSP](https://github.com/sublimelsp/LSP) 包拉起 maa-lsp 语言服务器，为 MaaFramework pipeline / interface JSON 提供 schema 校验、定义跳转和悬停预览。

## 前置条件

1. **Sublime Text 4**（需 Python 3.8+ 插件宿主）
2. **LSP** 包 — 通过 Package Control 安装 `LSP`
3. **Node.js** — 需在系统 PATH 中可执行（`node --version`）
4. **maa-lsp 构建** — 在仓库根目录运行 `pnpm install && pnpm build`，产物为 `pkgs/maa-lsp/dist/server.mjs`

## 安装

将 `pkgs/sublime` 符号链接到 Sublime Packages 目录，包名必须为 `MaaLSP`（与 settings 文件名一致）：

```powershell
# Windows (ST4)
$pkgs = Join-Path $env:APPDATA "Sublime Text\Packages\MaaLSP"
New-Item -ItemType SymbolicLink -Path $pkgs -Target "C:\github\maa-support-sublime\pkgs\sublime"
```

```bash
# macOS / Linux
ln -s /path/to/maa-support-sublime/pkgs/sublime ~/Library/Application\ Support/Sublime\ Text/Packages/MaaLSP
```

重启 Sublime Text。

## 配置

插件默认在 `pkgs/maa-lsp/dist/server.mjs`（相对插件目录）查找 server。如路径不符，在 `MaaLSP.sublime-settings`（User 覆盖）中设置：

```json
{
  "server_path": "/absolute/path/to/server.mjs"
}
```

若 `node` 不在 PATH，可直接覆盖 `command`：

```json
{
  "command": ["/path/to/node", "${server_path}", "--stdio"]
}
```

## 功能

| LSP 能力         | 说明                                                 |
| ---------------- | ---------------------------------------------------- |
| Diagnostics      | interface.json / pipeline JSON schema 校验，精确定位 |
| Go to Definition | 在 `next` / `target` / `anchor` 引用上跳转声明       |
| Hover            | task 定义片段 + merged JSON 预览                     |

> ⚠️ 本文档由 AI 生成，主要用于辅助 AI 理解项目。内容可能与实际代码不同步，请注意甄别。
