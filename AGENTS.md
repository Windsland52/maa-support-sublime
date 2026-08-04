# AGENTS.md

## 文档

项目文档位于 `docs/`（待建）。入口与导航索引待补。

## 修改代码时同步更新文档

修改包代码时同步更新 `docs/{pkg}/` 对应文档；修复 `docs/TODO.md` 条目标记 `[x]`，不删除条目。

## 提交前格式化

每次提交前用 Prettier 格式化本次受影响文件并确认通过：

    pnpm exec prettier --write <files...>
    pnpm exec prettier --check <files...>

不要为满足该要求格式化与本次提交无关的文件。全仓格式化须作为独立提交。

## 文档标识

`docs/` 下所有 `.md` 文件需在标题后包含：

> ⚠️ 本文档由 AI 生成，主要用于辅助 AI 理解项目。内容可能与实际代码不同步，请注意甄别。
