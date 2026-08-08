# TODO

> ⚠️ 本文档由 AI 生成，主要用于辅助 AI 理解项目。内容可能与实际代码不同步，请注意甄别。

## MVP

- [x] LSP diagnostics、definition、Hover
- [x] 对齐 maa-support-extension 的递归 interface 搜索规则
- [x] 支持所有 workspace folder 和多个 interface 项目
- [x] 读取各项目 `config/maa_pi_config.json` 的 controller/resource
- [x] 支持未保存的编辑器缓冲区
- [x] 生成不依赖仓库 `node_modules` 的单文件 LSP
- [x] 生成可直接安装的 `MaaLSP.sublime-package`
- [x] 添加 LSP 黑盒测试、Python 插件测试和 CI/Release 工作流
- [x] 在真实 Sublime Text + LSP 包 + Maa 项目中完成端到端人工验收
- [x] 确定公开 GitHub URL，并提供 Package Control 自定义 repository 配置
- [x] 创建首个语义版本 Release（`v0.1.0`）
- [x] 自定义 repository 兼容 Package Control 3.4.1
- [x] 声明 Sublime Python 3.8 插件宿主，确保 MaaLSP 可以导入新版 LSP
- [x] 发布 Python 宿主兼容性修复版本（`v0.1.1`）
- [x] 将公开包重命名为符合 helper 约定的 `LSP-MaaFramework`
- [x] 使用 `lsp_utils` 管理 Node runtime
- [x] 添加设置入口和设置 schema
- [x] 仅在 Maa 项目中启动 LSP
- [x] 完成 Package Control reviewer 检查
- [ ] 提交 Package Control 默认 channel

## 配置正确性

- [x] 加载并监听 `maatools.config.mts`
- [x] 应用 `parser.customReco` / `parser.customAction`
- [x] 应用 `check.override`
- [x] 热更新 `config/maa_pi_config.json`
- [x] ~~检测 MaaAssistantArknights 模式~~（不在本插件范围）
- [x] 报告配置加载失败
- [x] 避免启动时重复发布诊断

## 语言服务

- [x] Completion
- [x] References
- [x] Workspace Symbol
- [x] Code Lens
- [x] Inlay Hint
- [ ] Code Action
- [ ] Document Link
- [ ] Document Color
- [ ] 完整 Hover
- [x] ~~MaaAssistantArknights 特殊引用、悬停和求值~~（不在本插件范围）
- [ ] Formatting
- [ ] Rename
- [ ] Document Symbol

## Sublime 命令与资源选择

- [ ] controller/resource/locale 选择界面
- [ ] 活动项目和资源状态
- [ ] Goto Task
- [ ] task / expression 求值
- [ ] 手动重载项目和配置
- [ ] 运行环境检查

## MaaFramework 运行与调试

- [ ] 控制面板与任务队列
- [ ] 启动、暂停、继续和停止任务
- [ ] 运行状态与识别详情
- [ ] 任务断点与调试协议
- [ ] MaaFramework 版本与 registry 管理
- [ ] Agent 子进程管理
- [ ] 管理员、debug 和识别绘图模式
- [ ] 全局快捷键控制

## 图像、日志与浏览器面板

- [ ] 浏览器执行面板与 Sublime IPC
- [ ] 截图与裁剪
- [ ] OCR、模板匹配与 pipeline 识别测试
- [ ] Maa 日志分析 UI
- [ ] MaaLogAnalyzer 集成

## 稳定性

- [ ] 真实 Sublime 自动化 UI 测试
- [ ] 大型项目性能与配置热更新测试
