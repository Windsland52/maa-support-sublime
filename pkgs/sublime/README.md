# LSP-MaaFramework (Sublime Text plugin)

Sublime Text LSP 插件，通过社区 [LSP](https://github.com/sublimelsp/LSP) 包拉起内置的 maa-lsp，为 MaaFramework pipeline / interface JSON 提供诊断、定义跳转和悬停预览。

## 前置条件

1. **Sublime Text 4**
2. **LSP** 包 — 通过 Package Control 安装 `LSP`
3. **Node.js 20.19.0 或更高版本** — 优先使用系统 PATH；不可用时由 `lsp_utils` 提示下载仅供 LSP 使用的 runtime

用户不需要安装 pnpm，也不需要单独构建 maa-lsp。
发布包通过 `.python-version` 使用 Sublime Python 3.8 插件宿主，与当前 LSP 包保持一致。

## 用户安装

### GitHub Release

1. 从 [GitHub Releases](https://github.com/Windsland52/maa-support-sublime/releases) 下载 `LSP-MaaFramework.sublime-package`。
2. 在 Sublime Text 中打开 `Preferences > Browse Packages…`，进入其同级的 `Installed Packages` 目录。
3. 把文件复制到 `Installed Packages/LSP-MaaFramework.sublime-package`。
4. 重启 Sublime Text。

插件会在启动 LSP 前把内置的 `server.mjs` 解压到 Sublime cache，因此压缩安装和 Package Control 安装使用同一套产物。

### Package Control

正式收录到 Package Control 默认 channel 前，可以先添加本项目的软件源：

1. 执行 `Package Control: Add Repository`；
2. 输入 `https://raw.githubusercontent.com/Windsland52/maa-support-sublime/main/repository.json`；
3. 执行 `Package Control: Install Package` 并选择 `LSP-MaaFramework`。

默认 channel 收录后将不再需要第 1、2 步。

从 `MaaLSP` 0.1.x 升级时，先通过 `Package Control: Remove Package` 删除旧包，再安装 `LSP-MaaFramework`，避免两个 helper 同时启动。

## 开发安装

先在仓库根目录运行：

```powershell
pnpm install
pnpm build
```

再把 `pkgs/sublime` 符号链接到 Sublime Packages 目录，包名必须为 `LSP-MaaFramework`：

```powershell
$dest = Join-Path $env:APPDATA "Sublime Text\Packages\LSP-MaaFramework"
New-Item -ItemType SymbolicLink -Path $dest -Target "C:\github\maa-support-sublime\pkgs\sublime"
```

## 配置

执行 `Preferences: LSP-MaaFramework Settings` 打开用户设置。项目级覆盖可写在 `.sublime-project` 的 `settings.LSP.LSP-MaaFramework` 中，两处均提供设置 schema。

发布包会优先使用内置 `server.mjs`；开发目录会回退到相邻 `maa-lsp/dist/server.mjs`。如需覆盖，在 `LSP-MaaFramework.sublime-settings` 的 User 设置中指定：

```json
{
  "server_path": "/absolute/path/to/server.mjs"
}
```

Node runtime 由 `lsp_utils` 统一解析。可通过命令面板中的 `Preferences: LSP Utils Settings` 调整系统或包内 runtime 的优先级；无需修改 `command`。

## 项目发现

行为与 `maa-support-extension` 对齐：

- 扫描所有 workspace folder；
- 递归查找任意深度的 `interface.json` 和 `interface.jsonc`；
- 跳过隐藏目录、`node_modules`、`MaaUtils`、`MaaDeps`；
- 同时加载扫描到的所有 interface 项目；
- 从各项目的 `config/maa_pi_config.json` 读取 controller/resource，resource 无效时使用第一个可用项。

普通 JSON workspace 不会启动 Maa LSP；必须在 workspace 内递归发现 interface 文件，或当前文件的祖先目录中存在 interface 文件。

## 项目选择

命令面板提供以下命令：

- `MaaFramework: Select Controller`
- `MaaFramework: Select Resource`
- `MaaFramework: Select Locale`

命令会扫描所有 workspace folder 中的 interface，并在候选项中显示项目相对目录。选中后写入该项目的 `config/maa_pi_config.json`，同时保留文件中已有的其他配置字段。

打开项目内文件时，状态栏会显示所属 interface 项目、当前 resource，以及已配置的 controller 和 locale。切换或保存文件后自动刷新。

`MaaFramework: Goto Task` 列出当前 resource 中的 pipeline task，并显示定义文件和行号；选择后直接跳到任务声明。

`MaaFramework: Evaluate Task` 使用 maa-lsp 中已加载的 resource layer 求值任务，并在临时 JSON 文件中展示合并结果。MaaAssistantArknights 专用 expression 求值不在本插件范围。

`MaaFramework: Reload Projects and Config` 主动重扫 workspace，并重新加载 interface、`maatools.config.mts` 与项目选择配置。

## 功能

| LSP 能力         | 说明                                                           |
| ---------------- | -------------------------------------------------------------- |
| Diagnostics      | interface / pipeline 校验，支持未保存内容                      |
| Go to Definition | 在 task / target / anchor / ROI / locale 引用上跳转声明        |
| Hover            | task 定义片段与 merged JSON 预览，支持未保存内容               |
| Multi-root       | 多 workspace、多 interface 项目同时加载，并按文件路由 LSP 请求 |

> ⚠️ 本文档由 AI 生成，主要用于辅助 AI 理解项目。内容可能与实际代码不同步，请注意甄别。
