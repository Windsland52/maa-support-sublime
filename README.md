# LSP-MaaFramework (Sublime Text plugin)

`LSP-MaaFramework` starts its bundled MaaFramework language server through the community [LSP](https://github.com/sublimelsp/LSP) package. It provides language intelligence, project selection, MaaFramework runtime controls, recognition testing, and log analysis for pipeline/interface JSON and JSONC files.

[中文说明](#中文说明)

## Requirements

1. **Sublime Text 4**
2. The **LSP** package installed through Package Control
3. **Node.js 20.19.0 or newer** on `PATH`; when unavailable, `lsp_utils` can offer a managed runtime for the language server

Users do not need pnpm or a separate maa-lsp checkout. The package selects Sublime's Python 3.8 plugin host through its packaged `.python-version`.

## Installation

Run `Package Control: Install Package` and select `LSP-MaaFramework`. The package is available from the default channel through the merged [sublimelsp/repository#169](https://github.com/sublimelsp/repository/pull/169) submission.

Package Control installs both required Python libraries, `lsp_utils` and `sublime_lib`. If installation was interrupted and the console reports `No module named 'sublime_lib'`, restore Package Control connectivity and run `Package Control: Satisfy Dependencies`, then restart Sublime Text.

Alternatively, download `LSP-MaaFramework.sublime-package` from [GitHub Releases](https://github.com/Windsland52/maa-support-sublime/releases), place it in Sublime's sibling `Installed Packages` directory, and restart Sublime Text.

Remove the obsolete `MaaLSP` 0.1.x package before installing `LSP-MaaFramework`; Package Control cannot automatically migrate between package names.

## Quick start

1. Open the whole MaaFramework project folder in Sublime Text. The workspace must contain an `interface.json` or `interface.jsonc` at any supported depth.
2. Run `MaaFramework: Check Environment` from the command palette and confirm that the report ends in `PASS`.
3. Open a pipeline JSON/JSONC file. Diagnostics, completion, hover, navigation, symbols, references, rename, formatting, Code Lens, Inlay Hints, Code Actions, document links, and color previews are available through normal LSP commands.
4. Use `MaaFramework: Select Controller`, `Select Resource`, and `Select Locale` to update the active project's `config/maa_pi_config.json`.
5. Open `MaaFramework: Control Panel` to manage and run the persistent task queue. The first run installs the selected `@maaxyz/maa-node` version into this plugin's cache.

Additional command-palette tools cover task navigation/evaluation, runtime status and breakpoints, screenshots and crops, OCR/template/pipeline recognition tests, built-in log summaries, and the official MaaLogAnalyzer runtime inspection/web UI.

## Configuration

Run `Preferences: LSP-MaaFramework Settings` to edit user settings. Project-specific overrides belong under `settings.LSP.LSP-MaaFramework` in a `.sublime-project` file. Both locations use the package's settings schema. The server launcher, native runtime, MaaLogAnalyzer, and package commands all use LSP's resolved configuration, so project overrides take effect consistently.

The bundled `server.mjs` is used by installed packages. Development checkouts fall back to the adjacent `maa-lsp/dist/server.mjs`. To select another standalone server, customize `server_path` and leave the managed `command` setting unchanged.

## Optional key bindings

The package does not enable any key bindings by default. `Default.sublime-keymap` contains commented examples for start, pause/continue, stop, and screenshot commands. Copy only the bindings you want into `Preferences: Key Bindings`, then run `MaaFramework: Activate Global Shortcut Target` in the window that should receive them.

## Project scope

Discovery matches `maa-support-extension`: all workspace folders are scanned recursively for interface files while hidden directories, `node_modules`, `MaaUtils`, and `MaaDeps` are skipped. This plugin implements generic MaaFramework behavior only and deliberately excludes MaaAssistantArknights-specific layouts and expression semantics.

---

## 中文说明

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

本包已通过[默认 channel 收录 PR](https://github.com/sublimelsp/repository/pull/169)进入 Package Control。直接执行 `Package Control: Install Package` 并搜索 `LSP-MaaFramework`。

Package Control 会同时安装必需的 `lsp_utils` 和 `sublime_lib` Python library。若安装中断且 Console 报告 `No module named 'sublime_lib'`，请先恢复 Package Control 网络连接，再执行 `Package Control: Satisfy Dependencies` 并重启 Sublime Text。

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

执行 `Preferences: LSP-MaaFramework Settings` 打开用户设置。项目级覆盖可写在 `.sublime-project` 的 `settings.LSP.LSP-MaaFramework` 中，两处均提供设置 schema。server 启动、native runtime、MaaLogAnalyzer 与包命令统一使用 LSP 合并后的有效配置，因此项目级覆盖会一致生效。

发布包会优先使用内置 `server.mjs`；开发目录会回退到相邻 `maa-lsp/dist/server.mjs`。如需覆盖，应修改 `server_path` 并保持插件管理的 `command` 不变。在 `LSP-MaaFramework.sublime-settings` 的 User 设置中指定：

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

`MaaFramework: Check Environment` 检查 Sublime/LSP、Node、内置 server 和项目 JSON 配置，生成可复制的只读 PASS/FAIL 报告。

## 控制面板

`MaaFramework: Control Panel` 管理 `maa_pi_config.json` 中的持久化任务队列。可以从 interface task 中添加、删除队列实例，或选择队列项跳到对应 pipeline entry。

`Start Queue` 使用隔离的 native worker 执行队列；首次运行会把设置中的 `@maaxyz/maa-node` 安装到 Sublime cache。控制面板和命令面板均提供 Pause、Continue、Stop，native worker 异常退出不会中断 maa-lsp。

`Show Runtime Status` 展示有界实时事件历史；`Show Latest Recognition / Action Detail` 从 native Tasker 读取最近一次识别或动作的完整元数据。

`Manage Task Breakpoints` 按项目持久化 pipeline node 断点；worker 在命中的 `*.Starting` 通知处暂停，使用 Continue 或 Stop 解除。

`Select MaaFramework Version` 查询、标记并切换 5.5.0 以上 native 版本；`Select npm Registry` 在 npm 与 npmmirror 源间切换。

interface Agent 由 worker 作为子进程启动并绑定 native Client；输出与状态进入 runtime history，`Stop Agent Processes` 或 Stop/Shutdown 会统一回收。

管理员、native debug 和 recognition drawing 均可从控制面板切换。Windows 管理员模式要求以管理员身份运行 Sublime；插件不会绕过 UAC 自动提权。

插件默认不启用任何快捷键，避免覆盖用户或其他包的绑定。`Default.sublime-keymap` 提供了已注释的 `Ctrl+Alt+Shift+F5/F6/F7/F8` 示例；用户把需要的条目复制到 `Preferences: Key Bindings` 后，先执行 `Activate Global Shortcut Target`，即可从任意 Sublime window 启动、切换暂停、停止或截图。

`Open Browser Execution Panel` 使用内置 minihtml sheet 显示实时 IPC event，并通过安全的 `subl:` command URL 控制 worker；不开放 localhost 控制端口。

`Analyze Logs` 提供无需外部依赖的日志级别和 Maa event 汇总。`MaaLogAnalyzer…` 可按需安装官方 `@windsland52/maa-log-tools` 到 Sublime cache 并生成 runtime-inspection JSON，或打开 [MaaLogAnalyzer Web](https://mla.maafw.com)；打开网页时会复制当前项目 `debug/` 路径，但不会自动上传本地文件。

## 功能

| LSP 能力                        | 说明                                                            |
| ------------------------------- | --------------------------------------------------------------- |
| Diagnostics                     | interface / pipeline 校验，应用 `maatools.config.mts` override  |
| Completion / Definition / Hover | task、anchor、图片、locale 与 interface 的补全、跳转和合并信息  |
| References / Rename / Symbols   | 跨文件引用、重命名、Document Symbol 与 Workspace Symbol         |
| Code Lens / Inlay Hint          | task 引用数、活动资源状态、任务文档和 locale 文本               |
| Code Action / Formatting        | task 语法转换、图片路径修复和保留 JSONC 注释的格式化            |
| Document Link / Color           | interface/图片/文档链接，以及 RGB/HSV 颜色预览与回写            |
| Multi-root / unsaved buffers    | 多 workspace、多 interface 项目路由，并读取尚未保存的编辑器内容 |

> ⚠️ 本文档由 AI 生成，主要用于辅助 AI 理解项目。内容可能与实际代码不同步，请注意甄别。
