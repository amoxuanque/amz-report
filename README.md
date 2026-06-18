<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# AMZ Report

`AMZ Report` 是当前唯一主线交付项目，对外主链接是 [amz-report.vercel.app](https://amz-report.vercel.app)。

它基于 `Vite + React + TypeScript + Express + Sorftime MCP`，把 Amazon 卖家的四类高频判断收敛成一个主站入口：

- `找竞对`
- `竞对分析`
- `去寻源`
- `品类空间`

当前版本已经不是静态原型，而是接通了真实 Sorftime 数据链路，并把买家版寻源 Playbook 吸收到运行时报告模板中：

- 服务端代理 Sorftime MCP
- 可选接入 Aoxia 深挖 1688 字段
- 前端统一承接四种模式的输入、加载和报告结果
- 直接生成可落地的亚马逊竞品分析 / 竞对发现 / 1688 寻源支撑 / 品类空间报告

`crossborder-competitive-workbench/` 和根目录独立 HTML 现在都只作为参考资产，不再承接主线功能开发。

## 本地运行

前置要求：`Node.js 20+`

1. 安装依赖：
   `npm install`
2. 配置 Sorftime：
   可选方式 1：在 `.env.local` 里设置 `SORFTIME_MCP_URL`
   可选方式 2：直接复用 `~/.codex/config.toml` 里的 `mcp_servers.sorftime_mcp.url`
3. 启动开发环境：
   `npm run dev`

默认启动地址：`http://127.0.0.1:3000`

## 可用模式

- `找竞对`
  输入 1 个 ASIN，系统会自动锁定同类目里最值得跟踪的核心竞对，再生成对比报告。

- `竞对分析`
  输入 2 个 ASIN，系统会直接拉取商品、类目、评论、流量词和关键词数据，输出完整对比报告。

- `去寻源`
  输入 1 个 ASIN，系统会先找到 Amazon 侧基准盘，再补 1688 相似供给样本，按“页面初筛 -> 商家回复 -> 样品/小单验证”的 Playbook 输出寻源方向和风险提醒。

- `品类空间`
  输入 1 个 ASIN、Amazon 链接，或直接输入品类关键词，系统会输出当前盘子值不值得进、能不能进，以及下一步要看的空间信号。

## 当前实现

- 首页会自动从自由输入中提取 ASIN，支持空格、逗号、换行和 Amazon 商品链接。
- 首页已经统一承接 4 个模式，不再依赖旧 workbench 的原生 JS 模块。
- 服务端真实调用 Sorftime MCP：`product_detail`、`category_report`、`product_reviews`、`product_trend`、`product_traffic_terms`、`competitor_product_keywords`、`keyword_detail`、`keyword_extends`、`ali1688_similar_product`
- `去寻源` 报告页已经内置买家目标边界、数据分层、标准询盘模板、回复判断、样品/小单验证和压缩执行顺序
- 报告页使用真实数据驱动，不再依赖独立 HTML 样例作为主入口

## 服务接口

对外交付只保留两个公共接口：

- `GET /api/health`
- `POST /api/analyze`

不再把旧 workbench 的 `/api/login`、`/api/session`、`/api/logout` 当作主线接口。

## 环境变量

必需：

- `SORFTIME_MCP_URL`

可选：

- `AOXIA_ACCESS_KEY`
- `AOXIA_SECRET_KEY`

如果未配置 Aoxia，系统会在 `去寻源` 模式下自动回退为轻量寻源支撑，不阻断整条分析链路。

## Vercel 部署

- 该仓库已提供根目录 `api/` Serverless Functions，可直接部署到 Vercel。
- 线上必须配置 `SORFTIME_MCP_URL`，否则 `/api/health` 和 `/api/analyze` 无法调用 Sorftime。
- 如果要启用 1688 深挖增强，额外配置 `AOXIA_ACCESS_KEY` 与 `AOXIA_SECRET_KEY`。
- 默认静态产物输出目录为 `dist`，部署配置见 `vercel.json`。

推荐最小部署检查：

1. `npm run lint`
2. `npm run build`
3. 检查本地 `/api/health`
4. 至少跑一条 `找竞对`、`竞对分析`、`去寻源`、`品类空间` 链路
5. 上线后确认 [amz-report.vercel.app](https://amz-report.vercel.app) 首页可访问

## 常见故障定位

- `/api/health` 失败：
  先检查 `SORFTIME_MCP_URL` 是否已配置，或 `~/.codex/config.toml` 中是否存在可用的 Sorftime MCP 地址。

- `去寻源` 没有 shortlist：
  先区分是 Sorftime 第一轮样本不足，还是 Aoxia 深挖回退；页面数据只能做初筛，不能直接推导承接能力。

- Vercel 线上和本地结果不一致：
  优先检查线上环境变量、Aoxia 配置和最新部署是否生效，再排查数据回退逻辑。
