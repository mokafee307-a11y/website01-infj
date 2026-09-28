# INFJ 漫游飞船

React + TypeScript 网站，包含认知运行地图、思想家沙龙、迷茫卡牌、自我探索，以及 WebGL 文字和视频过场。

## 本地运行

需要 Node.js >= 22.13。

```sh
npm ci
npm run dev
```

`npm test` 构建静态网站并检查过场时序、静态产物和资源路径；`npx tsc --noEmit` 检查类型。`npm run start` 预览已构建的 `dist-pages/`。

## GitHub Pages 托管

- 源码仓库：<https://github.com/mokafee307-a11y/website01-infj>
- 初始网址：<https://mokafee307-a11y.github.io/website01-infj/>
- 自定义域名：<https://mokafee.com/>（需完成 DNS 切换）。

GitHub 仓库 Settings → Pages → Source 选择 **GitHub Actions**。推送 `main` 后，`.github/workflows/deploy-pages.yml` 自动安装依赖、检查类型、运行测试并发布 `dist-pages/`。

新入口为 `index.html` 和 `app/pages-entry.tsx`，使用 `vite.pages.config.ts` 构建。资源采用相对路径，同一份产物兼容项目子路径和自定义域名。线上运行不依赖 Sites、Cloudflare Worker 或 ChatGPT 登录。

当前沙龙回复和探索报告是预设演示，不调用 AI 服务；数据保存在当前页面状态中，没有后端或数据库。如果未来增加 AI API，必须通过独立服务端保存密钥，不能把密钥放入前端或公开仓库。

## 切换 mokafee.com

1. 先验证 GitHub Pages 初始网址、视频和页面交互正常。
2. 在 GitHub Pages 设置自定义域名 `mokafee.com`，再操作腾讯云 DNSPod。
3. 将 `@` 的旧网站 A 记录替换为以下四条 A 记录，删除仅与旧网站冲突的 `@` CNAME/AAAA，保留邮件 MX/TXT 等无关记录：

   ```text
   185.199.108.153
   185.199.109.153
   185.199.110.153
   185.199.111.153
   ```

4. 如果需要 `www`，将它的 CNAME 指向 `mokafee307-a11y.github.io`。
5. 等 DNS 和证书就绪后，在 GitHub Pages 开启 Enforce HTTPS，并在不同设备/网络检查访问。

GitHub Actions 发布不通过 `CNAME` 文件配置域名，以 Pages 设置为准。切换前记录腾讯云原解析值；验证完成前保留旧 Sites 部署。需要回滚时恢复旧解析即可（仍需等待 DNS 缓存更新）。

参考：[GitHub 自定义域名文档](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)。

## 保留的旧托管配置

`vite.config.ts`、`.openai/`、`scripts/`、`db/` 和 `app/chatgpt-auth.ts` 为原 Sites 模板配置，仅保留作参考/回滚，不参与 GitHub Pages 运行。`npm run dev:sites`、`npm run build:sites` 和 `npm run test:sites` 使用旧构建流程（部分辅助脚本需要 Linux 工具）。不要将旧 Sites 环境变量、登录信息或凭证提交到 GitHub。
