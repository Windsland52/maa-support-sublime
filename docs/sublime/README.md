# Sublime 插件与分发

> ⚠️ 本文档由 AI 生成，主要用于辅助 AI 理解项目。内容可能与实际代码不同步，请注意甄别。

## 包内容

`pnpm package:sublime` 生成 `release/LSP-MaaFramework.sublime-package`。它是 ZIP 格式，包含：

- 英文优先、保留完整中文章节的公开 `README.md`，方便 Package Control 国际用户和中文用户使用同一份说明；

- `.python-version`，固定为 `3.8`，确保插件与新版 LSP 运行在相同的 Sublime Python 宿主；
- `plugin.py`
- `LSP-MaaFramework.sublime-settings`
- `Default.sublime-commands`
- `Default.sublime-keymap`
- `sublime-package.json` 设置 schema
- `dependencies.json`
- 独立的 `server.mjs`
- 独立的 `runtime.mjs` native worker
- README、LICENSE、第三方声明

构建脚本会拒绝非 `3.8` 的插件宿主声明和仍含第三方裸 import 的 `server.mjs`，并在写包后校验所有必需条目。缺少 `.python-version` 时，Sublime 会回退到 Python 3.3，导致插件无法导入运行于 Python 3.8 的新版 LSP。

## 运行方式

插件按以下优先级解析 LSP server：

1. 用户配置的 `server_path`；默认设置文件将它放在首项，并用与 schema 一致的注释明确要求用户修改该项而不是插件管理的 `command`；
2. 解包目录内的 `server.mjs`；
3. 开发仓库相邻的 `maa-lsp/dist/server.mjs`；
4. 从 `.sublime-package` 读取并写入 Sublime cache 的 `server.mjs`。

因此 GitHub Release、Package Control 和开发符号链接共用一份插件实现。

Node runtime 通过 `lsp_utils.NodeManager` 解析，要求 `>=20.19.0`。优先复用 PATH 中满足版本的 Node；找不到时由 `lsp_utils` 提供隔离下载，不修改系统 Node。

`Preferences: LSP-MaaFramework Settings` 打开用户覆盖设置；`sublime-package.json` 同时为包设置和 `.sublime-project` 中的 `settings.LSP.LSP-MaaFramework` 提供 schema。插件从 LSP context 的 `configuration.root_settings` 读取合并后的有效配置，并按 window 缓存给 native runtime、MaaLogAnalyzer 和命令使用；不再绕过 LSP 直接读取设置文件，因此项目级覆盖会作用于全部功能。会修改设置的命令仍写入 User settings，并同步刷新当前 window 的缓存。

插件在 LSP 静态 JSON selector 之外执行 Maa 项目适用性检查：递归扫描 workspace，按 server 相同规则跳过隐藏目录、`node_modules`、`MaaUtils`、`MaaDeps`，仅发现 `interface.json` / `interface.jsonc` 后启动。无 workspace 时回退检查当前文件的祖先目录。

## 项目选择命令

命令面板提供 `MaaFramework: Select Controller`、`Select Resource` 和 `Select Locale`。三个命令扫描所有 workspace folder 内的 interface，规则与 LSP 项目发现一致；quick panel 条目同时显示 interface 相对目录与候选名称。选择后保留 `config/maa_pi_config.json` 的其他字段，原子写入 `controller`、`resource` 或 `__locale`。LSP 对该配置的文件监听会立即应用 controller/resource 变化。

打开 MaaFramework 项目内的文件时，状态栏显示 interface 的项目名和当前生效的 resource；已配置的 controller 与 locale 也会同时展示。切换文件、保存文件或执行上述选择命令后状态自动刷新，普通 JSON 文件不会残留 Maa 状态。

`MaaFramework: Goto Task` 从当前文件所属项目的有效 resource path 中读取 `pipeline/**/*.{json,jsonc}` 和 `default_pipeline.json`。quick panel 按任务名排序并显示来源文件与行号；同名任务按 resource path 后层覆盖前层的顺序定位，`$` 开头的内部任务不显示。选择后以 encoded position 打开声明行。

`MaaFramework: Evaluate Task` 选择任务后向当前 maa-lsp 会话发送 `maa/evaluateTask` 请求。server 使用已加载、已应用 resource layering 的 `InterfaceBundle.evalTask` 求值，并把合并后的 MaaFramework task 作为只读临时 JSON 展示。MaaAssistantArknights 的 task expression 求值不属于本插件范围，因此不注册相关命令或协议。

`MaaFramework: Reload Projects and Config` 发送 `maa/reloadProjects`，重新扫描全部 workspace folder，并重新加载 interface、`maatools.config.mts`、`maa_pi_config.json` 和各自 watcher。命令完成后刷新状态栏并显示加载成功的项目数。

`MaaFramework: Check Environment` 在异步线程检查 Sublime Text 4、LSP 包、可执行的 Node `>=20.19.0`、内置 server、workspace 中的 interface 数量，以及 interface / `maa_pi_config.json` 语法。结果写入只读临时报告，以 `[OK]`、`[WARN]`、`[FAIL]` 和最终 PASS/FAIL 标识，便于复制到 issue。

## 控制面板与任务队列

`MaaFramework: Control Panel` 展示活动项目的持久化任务队列。`Add Task to Queue…` 从 interface 的 `task` 定义中选择，并向 `config/maa_pi_config.json.task` 追加带稳定 `__key` 的队列项；`Remove Task from Queue…` 删除指定实例。队列允许重复任务并保留现有任务的 `option` 等字段。选择已有队列项会跳转到它的 pipeline entry 声明。

`Start Queue` 首次运行时通过 `lsp_utils` 的 Node/npm 将设置中的 `@maaxyz/maa-node` 版本安装到 `LspMaaFrameworkPlugin.plugin_storage_path`（Sublime 的 `Package Storage/LSP-MaaFramework`），然后启动独立 `runtime.mjs` worker。内置 server/runtime 解压与 MaaLogAnalyzer tools 也使用该路径，不再根据硬编码包名拼接 `sublime.cache_path()`。worker 用 pipeline manager 把当前 controller/resource/task 配置构造成 MaaFramework runtime，依次执行队列。后续启动复用已校验的本地 native 包。

`Pause Runtime` 在 Tasker 通知边界暂停并阻止下一队列项，`Continue Runtime` 释放等待，`Stop Runtime` 调用 native `post_stop()`。相同操作也作为独立命令出现在命令面板。插件卸载时向 worker 发送 shutdown；worker 与 maa-lsp 分进程，因此 native 崩溃不影响语言服务。

`Show Runtime Status` 将 worker 当前状态、当前任务、队列和最近 500 条 controller/resource/tasker event 写入只读 JSON。`Show Latest Recognition / Action Detail` 根据实时通知中的最新 `reco_id` / `action_id` 请求 native 详情；JSON 展示完整元数据，只把可能很大的 PNG data URL 折叠成长度占位（图像查看命令另行处理）。

`Manage Task Breakpoints` 列出活动 resource 的所有 pipeline task，实心圆表示已启用。断点按项目绝对路径持久化到插件 User settings，启动时传给 worker，运行中切换则通过 `setBreakpoints` 即时同步。Tasker 的任意 `*.Starting` 通知命中任务名时进入 paused，status history 同时记录 breakpoint event；Continue 或 Stop 解除闸门。

`Select MaaFramework Version` 使用托管 Node 的 npm 查询 `@maaxyz/maa-node` 版本，过滤低于 5.5.0 的版本并按 semver 降序显示；当前版本和 Sublime cache 中已安装的版本带状态标记。选择新版本会关闭旧 worker，下一次 Start 时安装并加载。`Select npm Registry` 可在官方 npm 与 npmmirror/cnpm 间切换，影响版本查询和后续安装。

interface 配置 `agent.child_exec` 时，native worker 展开 `{PROJECT_DIR}`、启动子进程并通过 MaaFramework Client 绑定当前 Resource/Controller/Tasker。Agent stdout/stderr 与生命周期进入 runtime history；`agent_timeout` 控制连接等待。`Stop Agent Processes` 可独立 destroy Client 并终止子进程，Stop/Shutdown 也保证回收。VS Code `launch.json` debug-session 映射没有跨编辑器语义，因此不实现。

三个模式命令都会先关闭旧 worker，使下一次 Start 使用新设置：

- `Toggle Native Debug Mode` 映射 `maa.Global.debug_mode`；
- `Toggle Recognition Drawing` 映射 `maa.Global.save_draw`，绘图写入项目 debug log 目录；
- `Toggle Administrator Mode` 在 Windows 要求当前 Sublime 进程已经提升权限。插件不绕过 UAC 或静默自提权；未提升时 Start 会拒绝并提示通过“以管理员身份运行”重启 Sublime。非 Windows 平台不施加该检查。

`Activate Global Shortcut Target` 把当前 Sublime window 设为运行控制目标。之后同一 Sublime 应用内任意窗口的快捷键都会路由到该目标：

插件不默认注册快捷键；以下条目仅作为 `Default.sublime-keymap` 中的注释示例提供，用户需把需要的绑定复制到 `Preferences: Key Bindings`：

- `Ctrl+Alt+Shift+F5`：Start Queue；
- `Ctrl+Alt+Shift+F6`：Pause / Continue 切换；
- `Ctrl+Alt+Shift+F7`：Stop Runtime。
- `Ctrl+Alt+Shift+F8`：Capture Screenshot。

这里的“全局”与相邻扩展一致，指编辑器多窗口间的目标路由；Sublime 失去系统焦点后不会安装操作系统级键盘 hook。用户可在 User keymap 覆盖按键，命令名保持稳定。

## 浏览器执行面板

`Open Browser Execution Panel` 创建 Sublime Text 4 minihtml sheet，显示 worker 状态与最近 50 条 IPC event。Start/Pause/Continue/Stop、状态 JSON、最新 native detail 和 Refresh 均使用 Sublime 原生 `subl:` command URL 回到 WindowCommand，再进入逐行 JSON worker IPC。面板不启动 localhost server、不执行任意 JavaScript，也不向外部浏览器暴露控制端口；runtime event 到达时自动刷新已打开的 sheet。

## 截图与裁剪

`Capture Screenshot` 调用当前 native Controller 的 `post_screencap()`，将 PNG 写入活动项目的 `debug/screenshot/` 并用 Sublime 图片视图打开。`Crop Screenshot…` 依次输入 x、y、width、height；worker 使用 Jimp 校验截图边界并裁剪，结果写入同一目录。两个操作都要求先 Start 以建立 controller 连接，也可从控制面板或浏览器执行面板调用；用户启用示例 F8 快捷键后，它会按已激活的全局目标窗口路由。

## 识别测试

三个测试命令都使用当前 Controller 截图和已加载的 MaaFramework Resource，并把 native 识别详情写入只读 JSON：

- `Test OCR` 对整张截图运行 MaaFramework `OCR`，模型直接取自当前通用 resource；不复制或适配 MaaAssistantArknights 资源；
- `Test Template Match` 输入一个本地 PNG 路径，通过临时 `override_image` 以 `TemplateMatch`、method 5、threshold 0.7 匹配；
- `Test Pipeline Recognition` 从当前 resource 的 pipeline task 中选择节点，调用 `run_recognition` 测试其识别配置。

为避免同一 Tasker 并发执行，识别测试需要等待队列进入 finished/stopped 后调用。每次测试使用唯一的临时 custom action，结果保留识别元数据及 raw/draw PNG data URL；报告本身不会把图像写入 resource。

## Maa 日志分析 UI

`Analyze Logs` 扫描活动项目 `debug/` 下的 `.log` / `.txt`，默认打开最新文件。内置 minihtml sheet 汇总 TRC/DBG/INF/WRN/ERR/FTL 数量和出现次数最多的 Maa event，并提供 Events、Warnings + Errors、Errors、All 四种视图以及 `Open Raw Log`。筛选只通过 `subl:` command URL 回到受路径校验的 WindowCommand，不执行脚本。

为控制大型日志的内存和 UI 开销，最多读取文件末尾 8 MiB、最多展示最近 300 条匹配记录；UI 会明确标识是否截断。文件读取和分析在线程池执行，不阻塞 Sublime UI。此功能只解析 MaaFramework 通用日志格式，不识别 MaaAssistantArknights 专有任务。

## MaaLogAnalyzer 集成

`MaaLogAnalyzer…` 提供两个互补入口：

- `Runtime Inspection` 通过托管 Node/npm 将 MaaXYZ/MaaLogAnalyzer 官方发布的 `@windsland52/maa-log-tools` 安装到 Sublime cache，针对活动项目 `debug/` 执行 `--runtime-inspection --pretty`，并在只读 JSON 中展示 session、failure、outcome 和 signal。默认固定 `maa_log_tools_version: 1.3.0`，可在设置中升级，下载沿用所选 npm registry；
- `Open Visual Analyzer` 打开官方 [mla.maafw.com](https://mla.maafw.com)，同时将活动项目 `debug/` 绝对路径复制到剪贴板，用户在网页文件选择器中手动选择。浏览器安全模型不允许插件替用户把本地日志静默上传。

本地 Tauri v3.5.0 当前没有对外声明“启动时直接载入文件”的 CLI/文件关联接口，因此插件不伪造无效参数；可视化入口使用官方 Web，结构化检查使用官方可复用 parser。两者都不把 MaaAssistantArknights 逻辑带入本插件。

## 包名迁移

0.2.0 起公开包名从 `MaaLSP` 调整为 `LSP-MaaFramework`，以符合 Package Control 的 LSP helper 命名约定。Package Control 不会跨包名自动升级，0.1.x 用户需要移除旧包后安装新包。

## 自动化

- 根目录 Python 开发环境由 uv 管理；`.python-version` 选择 Python 3.13，`uv.lock` 锁定 Ruff 与 `st-package-reviewer`。CI/Release 使用 `astral-sh/setup-uv` 和 `uv run --frozen`，不执行裸 `pip install`；安装包内 `.python-version` 仍是 Sublime plugin host 所需的 3.8；
- CI 在 Node 24 上执行 lint、LSP 黑盒测试、Python 插件测试、安装包构建和 package-only tag 的无推送校验；普通 branch/PR 可执行该校验，只有 `v*` release job 真正推送 tag 时才要求 Git ref 与包版本一致；
- `pnpm test:sublime-ui` 将 Sublime Text 安装目录复制为临时 portable 实例，复用真实 LSP/lsp_utils 依赖，安装本次生成的 `.sublime-package`，并由 Python 3.8 plugin host 自动打开 fixture。测试验证 Maa 项目标记、状态栏、控制 minihtml sheet、日志分析 sheet 和环境 PASS 报告，随后退出实例并清理临时目录；它不会读写用户的 Packages/Installed Packages；
- CI 解压最终安装包并使用官方 `st-package-reviewer --fail-on-warnings` 审核，warning 或 failure 均阻止合并；
- 推送 `v*` tag 时创建或更新 GitHub Release，并上传 `LSP-MaaFramework.sublime-package`；随后把同一安装包展开为独立 Git commit，发布对应的 `sublime-v*` package-only tag；
- `sublime-v*` tag 根目录只包含安装包文件，其中 `.python-version` 为 3.8，并包含构建后的 `server.mjs` / `runtime.mjs`。它与 main 的 monorepo tag 隔离，因此 Package Control 可以直接安装 tag archive；
- 根目录 `repository.json` 使用 schema 3 和 `"tags": "sublime-v"`，兼容 Package Control 3.4.1 并自动发现后续语义版本，允许用户在正式收录前通过 `Add Repository` 安装；
- 本包按官方 LSP helper 路由提交到 `sublimelsp/repository`；该 repository 已由 Package Control 默认 channel 引用。收录 PR 为 [`sublimelsp/repository#169`](https://github.com/sublimelsp/repository/pull/169)，官方条目同样跟踪 `sublime-v*`，后续版本不再逐次修改 channel。
