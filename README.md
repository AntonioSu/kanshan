# 看山反卷实验室

一个比赛 Demo：输入一段努力困惑，模拟看山 Agent 拆解问题、检索知乎经验样本、分析成功/失败路径，并生成一份反卷实验报告。

## 本地运行

```bash
npm install
npm run dev
```

## 后续接入知乎 CLI

接口预留在 `src/api/zhihu.ts`。当前使用 `MockZhihuProvider`，后续可以替换为 `CliZhihuProvider`，把用户问题传入知乎 CLI 搜索，再将回答抽取为统一的 `ZhihuEvidence` 数据结构。

## GitHub Pages

推送到 `main` 后会通过 GitHub Actions 自动发布。启用 Pages 并选择 GitHub Actions 作为来源后，在线地址为：

`https://antoniosu.github.io/kanshan/`
