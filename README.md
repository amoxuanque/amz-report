<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# AMZ Report

一个基于 `Vite + React + TypeScript + Sorftime MCP` 的亚马逊竞品分析工作台。

当前版本提供三种入口：

- `找竞对`
- `竞对分析`
- `去寻源`

当前版本已经不是静态原型，而是接通了真实 Sorftime 数据链路：

- 服务端代理 Sorftime MCP
- 前端保留原有工作台 UI
- 直接生成可落地的亚马逊竞品分析 / 竞对发现 / 1688 寻源支撑报告

## 本地运行

前置要求：`Node.js 20+`

1. Install dependencies:
   `npm install`
2. Configure Sorftime:
   可选方式 1：在 `.env.local` 里设置 `SORFTIME_MCP_URL`
   可选方式 2：直接复用 `~/.codex/config.toml` 里的 `mcp_servers.sorftime_mcp.url`
3. Run the app:
   `npm run dev`

默认启动地址：`http://127.0.0.1:3000`

## 可用模式

- `找竞对`
  输入 1 个 ASIN，系统会自动锁定同类目里最值得跟踪的核心竞对，再生成对比报告。

- `竞对分析`
  输入 2 个 ASIN，系统会直接拉取商品、类目、评论、流量词和关键词数据，输出完整对比报告。

- `去寻源`
  输入 1 个 ASIN，系统会先找到 Amazon 侧基准盘，再补 1688 相似供给样本，给出寻源方向和风险提醒。

## 当前实现

- 首页会自动从自由输入中提取 ASIN，支持空格、逗号、换行和 Amazon 商品链接。
- 服务端真实调用 Sorftime MCP：`product_detail`、`category_report`、`product_reviews`、`product_trend`、`product_traffic_terms`、`competitor_product_keywords`、`keyword_detail`、`keyword_extends`、`ali1688_similar_product`
- 报告页使用真实数据驱动，不再依赖硬编码样例
- 本地验证通过：`npm run lint`、`npm run build`、`/api/health`、`/api/analyze`

## Vercel 部署

- 该仓库已提供根目录 `api/` Serverless Functions，可直接部署到 Vercel。
- 线上必须配置 `SORFTIME_MCP_URL`，否则 `/api/health` 和 `/api/analyze` 无法调用 Sorftime。
- 默认静态产物输出目录为 `dist`，部署配置见 `vercel.json`。
