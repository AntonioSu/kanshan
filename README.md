# 看山反卷实验室

一个比赛 Demo，包含两种分析模式：

- 输入一段努力困惑，检索知乎经验样本并生成反卷实验报告。
- 输入当前已授权账号的知乎个人主页，汇总公开创作并生成内容结构、互动表现、表达画像与增长建议。

## 本地运行

```bash
npm install
npm run dev
```

## 知乎真实数据接入

问题分析数据源在 `src/api/zhihu.ts`，主页分析数据源在 `src/api/profile.ts`。未配置对应的 Vite API URL 时使用演示数据；配置后会通过服务端代理调用知乎开放平台接口。

服务端代理位于 `api/zhihu-search.mjs` 和 `api/zhihu-profile.mjs`，需要在服务端设置 `ZHIHU_ACCESS_SECRET`。该密钥不能放进 Vite 变量、浏览器代码或 GitHub 仓库。接口信息以[知乎开放平台文档](https://developer.zhihu.com/docs?key=zhihu_cli)为准。

个人内容 API 在不提供 OAuth Token 时只返回 Access Secret 所属账号的公开内容。读取其他用户的内容需要该用户完成知乎 OAuth 授权，不能仅凭任意公开主页 URL 获取。

Vercel 部署时执行 `npm run build:vercel`，前端会自动请求同域的 `/api/zhihu-search` 与 `/api/zhihu-profile`。GitHub Pages 仍可作为 Mock 演示版；如需从 Pages 调用真实代理，请在构建时设置两个 API URL。

## GitHub Pages

推送到 `main` 后会通过 GitHub Actions 自动发布。启用 Pages 并选择 GitHub Actions 作为来源后，在线地址为：

`https://antoniosu.github.io/kanshan/`
