<div align="center">

# 真探 · TrueDetective

**海外涉华信息智能核查平台**

求真 · 求证 · 求实

</div>

---

面向核查工作台的纯前端 SPA（Mock 数据演示）：覆盖线索接入、九环节核查漏斗、证据溯源、多语种交叉验证到人工审核结案的全流程可视化。

## ✨ 功能模块

| 模块 | 路由 | 说明 |
|---|---|---|
| 工作台 | `/workbench` | 累计线索趋势、KPI 总览、待人工审核、九环节漏斗、信源可信度雷达、进行中案件 |
| 线索中心 | `/clues` | 新建线索并一键生成核查任务 |
| 核查任务 | `/tasks` | 任务列表检索与状态追踪 |
| 证据库 | `/evidence` | 证据材料归档与关联案件 |
| 历史案例 | `/history` | 已结案案例与核查报告 |
| 知识库 | `/knowledge` | 核查规范与素材沉淀 |
| 数据统计 | `/statistics` | 12 周趋势、成员产出、核查类型构成、来源平台分布 |
| 用户管理 | `/users` | 成员与角色管理 |
| 案件详情工作台 | `/cases/:caseId` | 单案件全流程核查：初筛→拆解→检索→出处→交叉→信源→报告→人工审核，支持审核结论提交与删除 |

- **登录守卫**：未登录访问任意页面会重定向到 `/login`，登录成功后自动回到原目标页；支持 `?autostart=1` 免登录直达
- **URL 路由**：浏览器前进/后退、刷新保持、案件链接可直接分享
- **性能优化**：路由级代码分包（每个视图独立 chunk + vendor 分组），首屏 gzip 约 95 kB
- **响应式**：桌面固定侧边栏（sticky）、移动端抽屉菜单；图表按容器宽度自适应（ResizeObserver 动态 viewBox）

## 🛠 技术栈

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite 8](https://vite.dev/)（Rolldown 内核）
- [Tailwind CSS 4](https://tailwindcss.com/)（`@tailwindcss/vite` 插件）
- [React Router v7](https://reactrouter.com/)（`react-router-dom`）
- [lucide-react](https://lucide.dev/) 图标
- 包管理：**pnpm**

## 🚀 快速开始

```bash
# 1. 安装依赖
pnpm install

# 2. 启动开发服务器（http://localhost:3000）
pnpm dev

# 3. 类型检查 / 生产构建 / 本地预览
pnpm lint    # tsc --noEmit
pnpm build   # 产出 dist/
pnpm preview
```

> 演示账号已预填，登录页直接点击「登录进入工作台」即可；跳过登录可访问 `http://localhost:3000/?autostart=1`。
>
> 若 3000 端口被占用：`npx vite --port=3100 --strictPort`

## 🔀 路由模式

默认 **Hash 模式**（`/#/workbench`），任何静态托管环境可直接部署，刷新深链接永不 404。

部署环境支持 SPA history fallback 时，可切换为干净 URL：

```bash
# .env.local
VITE_ROUTER_MODE=history
```

| 模式 | URL 样式 | 要求 |
|---|---|---|
| `hash`（默认） | `/#/tasks` | 无 |
| `history` | `/tasks` | 服务器将未知路径 fallback 到 `index.html` |

## 📁 目录结构

```
├── index.html                  # 入口 HTML（系统字体栈，无第三方字体请求）
├── vite.config.ts              # Vite 配置：路由分包（advancedChunks）
├── public/                     # 静态资源
└── src/
    ├── App.tsx                 # 路由表 + 登录守卫 + 应用壳
    ├── main.tsx
    ├── index.css               # Tailwind + 基础样式 + 移动端输入 16px 防缩放
    ├── components/
    │   ├── Sidebar.tsx         # 侧边导航（NavLink 高亮）
    │   ├── TopBar.tsx          # 顶栏：搜索 / 时间范围 / 用户
    │   ├── ScrollToTop.tsx     # 路由切换回顶
    │   ├── Row1–Row4*.tsx      # 工作台各行图表卡片
    │   └── views/              # 各路由视图 + 案件详情工作台 + WorkbenchView
    ├── data/                   # Mock 数据（仪表盘 / 案件详情 / 线索视图）
    └── utils/
        ├── dashboardLogic.ts   # 过滤与热力图配色逻辑（含单测）
        └── useElementWidth.ts  # 图表宽度自适应 hook
```

## 📄 其他

- `.env.example` 中的 `GEMINI_API_KEY` / `APP_URL` 为 AI Studio 导出模板遗留，当前为纯前端 Mock 演示，未调用任何外部 API。
