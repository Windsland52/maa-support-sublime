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
- [ ] 在真实 Sublime Text + LSP 包 + Maa 项目中完成端到端人工验收
- [x] 确定公开 GitHub URL，并提供 Package Control 自定义 repository 配置
- [x] 创建首个语义版本 Release（`v0.1.0`）
- [x] 自定义 repository 兼容 Package Control 3.4.1
- [ ] 提交 Package Control 默认 channel

## MVP 之后

- [ ] Completion / Code Action / Code Lens 等语言能力
- [ ] 浏览器执行面板与 Sublime IPC
- [ ] Maa 日志分析 UI
