# Sublime 插件与分发

> ⚠️ 本文档由 AI 生成，主要用于辅助 AI 理解项目。内容可能与实际代码不同步，请注意甄别。

## 包内容

`pnpm package:sublime` 生成 `release/LSP-MaaFramework.sublime-package`。它是 ZIP 格式，包含：

- `.python-version`，固定为 `3.8`，确保插件与新版 LSP 运行在相同的 Sublime Python 宿主；
- `plugin.py`
- `LSP-MaaFramework.sublime-settings`
- `Default.sublime-commands`
- `sublime-package.json` 设置 schema
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

`Preferences: LSP-MaaFramework Settings` 打开用户覆盖设置；`sublime-package.json` 同时为包设置和 `.sublime-project` 中的 `settings.LSP.LSP-MaaFramework` 提供 schema。

插件在 LSP 静态 JSON selector 之外执行 Maa 项目适用性检查：递归扫描 workspace，按 server 相同规则跳过隐藏目录、`node_modules`、`MaaUtils`、`MaaDeps`，仅发现 `interface.json` / `interface.jsonc` 后启动。无 workspace 时回退检查当前文件的祖先目录。

## 项目选择命令

命令面板提供 `MaaFramework: Select Controller`、`Select Resource` 和 `Select Locale`。三个命令扫描所有 workspace folder 内的 interface，规则与 LSP 项目发现一致；quick panel 条目同时显示 interface 相对目录与候选名称。选择后保留 `config/maa_pi_config.json` 的其他字段，原子写入 `controller`、`resource` 或 `__locale`。LSP 对该配置的文件监听会立即应用 controller/resource 变化。

打开 MaaFramework 项目内的文件时，状态栏显示 interface 的项目名和当前生效的 resource；已配置的 controller 与 locale 也会同时展示。切换文件、保存文件或执行上述选择命令后状态自动刷新，普通 JSON 文件不会残留 Maa 状态。

`MaaFramework: Goto Task` 从当前文件所属项目的有效 resource path 中读取 `pipeline/**/*.{json,jsonc}` 和 `default_pipeline.json`。quick panel 按任务名排序并显示来源文件与行号；同名任务按 resource path 后层覆盖前层的顺序定位，`$` 开头的内部任务不显示。选择后以 encoded position 打开声明行。

`MaaFramework: Evaluate Task` 选择任务后向当前 maa-lsp 会话发送 `maa/evaluateTask` 请求。server 使用已加载、已应用 resource layering 的 `InterfaceBundle.evalTask` 求值，并把合并后的 MaaFramework task 作为只读临时 JSON 展示。MaaAssistantArknights 的 task expression 求值不属于本插件范围，因此不注册相关命令或协议。

`MaaFramework: Reload Projects and Config` 发送 `maa/reloadProjects`，重新扫描全部 workspace folder，并重新加载 interface、`maatools.config.mts`、`maa_pi_config.json` 和各自 watcher。命令完成后刷新状态栏并显示加载成功的项目数。

## 包名迁移

0.2.0 起公开包名从 `MaaLSP` 调整为 `LSP-MaaFramework`，以符合 Package Control 的 LSP helper 命名约定。Package Control 不会跨包名自动升级，0.1.x 用户需要移除旧包后安装新包。

## 自动化

- CI 在 Node 24 上执行 lint、LSP 黑盒测试、Python 插件测试和安装包构建；
- CI 解压最终安装包并使用官方 `st-package-reviewer --fail-on-warnings` 审核，warning 或 failure 均阻止合并；
- 推送 `v*` tag 时创建或更新 GitHub Release，并上传 `LSP-MaaFramework.sublime-package`；
- 根目录 `repository.json` 使用 schema 3 和显式 GitHub Release 下载地址，兼容 Package Control 3.4.1，允许用户在正式收录前通过 `Add Repository` 安装；
- Package Control 默认 channel 条目需在首个 Release 建立后另行提交。
