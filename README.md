# 看山反卷实验室

一个比赛 Demo：输入一段努力困惑，模拟看山 Agent 拆解问题、检索知乎经验样本、分析成功/失败路径，并生成一份反卷实验报告。

## 本地运行

```bash
npm install
npm run dev
```

## 知乎真实数据接入

前端数据源在 `src/api/zhihu.ts`。未配置 `VITE_ZHIHU_API_URL` 时使用演示数据；配置后会通过服务端代理调用知乎开放平台的知乎搜索 API，并把真实结果转换为统一的 `ZhihuEvidence` 数据结构。

服务端代理位于 `api/zhihu-search.mjs`，需要在服务端设置 `ZHIHU_ACCESS_SECRET`。该密钥不能放进 Vite 变量、浏览器代码或 GitHub 仓库。接口信息以[知乎开放平台文档](https://developer.zhihu.com/docs?key=zhihu_cli)为准。

Vercel 部署时执行 `npm run build:vercel`，前端会自动请求同域的 `/api/zhihu-search`。GitHub Pages 仍可作为 Mock 演示版；如需从 Pages 调用真实代理，请在构建时把 `VITE_ZHIHU_API_URL` 设置为代理的完整 HTTPS 地址。

## GitHub Pages

推送到 `main` 后会通过 GitHub Actions 自动发布。启用 Pages 并选择 GitHub Actions 作为来源后，在线地址为：

`https://antoniosu.github.io/kanshan/`
