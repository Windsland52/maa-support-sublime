# maa-lsp MVP

> ⚠️ 本文档由 AI 生成，主要用于辅助 AI 理解项目。内容可能与实际代码不同步，请注意甄别。

## 项目发现

`maa-lsp` 对初始化参数中的所有 `workspaceFolders` 执行递归扫描；旧客户端回退到 `rootUri` / `rootPath`。规则与 `maa-support-extension/pkgs/extension/src/utils/fs.ts` 一致：

- 识别任意深度的 `interface.json` 和 `interface.jsonc`；
- 不进入名称以 `.` 开头的目录；
- 不进入 `node_modules`、`MaaUtils`、`MaaDeps`；
- 每个 interface 建立独立 `InterfaceBundle`；
- 多项目请求优先匹配目录层级更深的 bundle。

workspace folder 增删或客户端报告 interface 文件新增/删除时会重新扫描。

本插件只支持 MaaFramework 项目，资源固定按 `pipeline/` 与 `image/` 布局解析；不检测或兼容 MaaAssistantArknights 的 `tasks/` 与 `template/` 布局。

## maatools 配置

每个 workspace 根目录的 `maatools.config.mts` 通过 `jiti` 独立加载，同一 workspace 内发现的 interface 项目共享该配置。LSP 直接监听配置文件的新增、修改和删除；变更后重建对应项目。

配置语法错误、导入失败或执行异常会同时写入 LSP 日志并通过客户端错误通知显示配置路径与错误原因。失败时仅回退为空配置，workspace 内的 interface 项目仍继续加载；修正并保存配置后会自动重试。

`parser.customReco` 和 `parser.customAction` 会传给每个 `InterfaceBundle`，因此自定义识别与动作参数里的任务、锚点、模板引用能参与跳转、悬浮和诊断。

`check.override` 以 manager 的诊断类型（例如 `unknown-task`、`dynamic-image`）为键，可将其覆盖成 `error`、`warning` 或 `ignore`。覆盖同时应用于初次扫描和配置热更新后的扫描。

每次扫描按 URI 记录完整诊断指纹；内容未变化时不重复发送 `publishDiagnostics`。诊断新增、修改、清空以及项目卸载仍会正常通知客户端。

## 资源选择

每个项目读取 interface 同级的 `config/maa_pi_config.json`：

- `controller` 支持当前字符串格式和旧版 `{ "name": "..." }` 格式；
- `resource` 有效时沿用；
- resource 缺失或无效时选择 interface 中的第一个 resource。

LSP 直接监听每个 interface 同级的 `config/maa_pi_config.json`。文件新增、修改或删除后只切换该项目的活动 controller/resource 并重新发布诊断，不重扫 workspace，也不需要重启 Sublime。

## 编辑器内容

LSP 使用增量文本同步。打开的文档从客户端缓冲区读取，未打开的文档从磁盘读取；文档修改和关闭都会通知 `InterfaceBundle` 刷新。位置换算、诊断、定义跳转和 Hover 使用相同内容来源。

## 能力

- Diagnostics
- Completion（任务、锚点、图片、locale 与 interface 引用）
- Definition
- References（pipeline 与 interface 声明/引用）
- Workspace Symbol（跨项目任务名搜索）
- Code Lens（任务引用数与活动资源状态）
- Inlay Hint（任务文档与当前 locale 文本）
- Code Action（任务 v1/v2 语法互转与图片路径 quick-fix）
- Document Link（interface 路径、模板图片与本地文档）
- Document Color（RGB/HSV 颜色预览与回写）
- Formatting（保留 JSONC 注释与尾逗号）
- Rename（pipeline 与 interface 跨文件声明/引用）
- Document Symbol（任务、锚点、子识别、interface 声明与 locale 键）
- Hover（任务合并结果、图片预览、locale、颜色、锚点与 interface 信息）
- Multi-root workspace

## 自定义请求

`maa/evaluateTask` 接收 `{ "uri": string, "task": string }`。server 根据 URI 路由到目录层级最深的 MaaFramework 项目，刷新当前 `InterfaceBundle` 后返回 `evalTask` 的 resource layer 合并结果；任务或项目不存在时返回 `null`。该请求不实现 MaaAssistantArknights 专用的 expression 语义。

`maa/reloadProjects` 无参数，串行等待已有刷新后重新扫描所有 workspace folder，并重建 interface bundle、`maatools.config.mts` 和 `maa_pi_config.json` 监听；成功后返回 `{ "projects": number }`。

## Native runtime worker

`src/runtime.ts` 独立构建为无第三方裸 import 的 `runtime.mjs`，不运行在 maa-lsp 进程内。它从参数指定的 cache `node_modules` 动态加载 `@maaxyz/maa-node`，解析活动项目的 interface / `maa_pi_config.json`，使用 pipeline manager 构建 controller、resource 和 task runtime，并通过逐行 JSON 请求处理 `start`、`pause`、`continue`、`stop`、`shutdown`。Tasker、controller、resource 与 context 通知作为 event 消息返回宿主。

pause 在 tasker sink 上施加异步闸门并阻止下一队列项开始；continue 释放闸门；stop 同时释放暂停等待并调用 `Tasker.post_stop()`。worker 与 LSP 分进程，native module 异常退出不会终止语言服务。

worker 保留最近 500 条 controller/resource/tasker/task/state event。`status` 返回当前状态、当前任务、队列与该有界历史；`recognitionDetail`、`actionDetail` 和 `nodeDetail` 分别读取 native Tasker/Resource 的识别、动作和 pipeline node 详情。识别原图与 draws 转换为 PNG data URL 后跨进程返回。

`start.breakTasks` 和运行时 `setBreakpoints` 设置 pipeline node 名称集合。当 Tasker 的 `*.Starting` 通知命中断点时，worker 先发布 `breakpoint` 与带 `reason: breakpoint` 的 paused state，再在 sink 异步闸门等待 continue/stop。这组逐行 JSON 请求、响应和 event 构成本插件的轻量调试协议。

interface 的 `agent.child_exec` / `child_args` 由 worker 直接启动，`{PROJECT_DIR}` 在可执行文件和参数中展开。worker 为每项创建 native Client，传入 MaaPi/Sublime 环境、resource path 和连接超时，连接成功后注册 controller/resource/tasker sink。stdout、stderr 与 connected/exited/stopped 生命周期作为 agent event 返回；`stopAgents`、stop 后的 session 销毁和 shutdown 都会 destroy Client 并终止仍存活的子进程。VS Code 专用的 debug-session 映射不在本插件范围。
