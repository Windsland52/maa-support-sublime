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
- Hover
- Multi-root workspace

当前未实现 code action、formatting、code lens 和资源选择 UI。
