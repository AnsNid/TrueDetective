<div align="center">

# 真探 · TrueDetective

**海外涉华信息智能核查平台**

求真 · 求证 · 求实

</div>

---

面向核查工作台的全栈应用：前端 React SPA + 后端 X-PHP `detective` 独立服务，覆盖线索接入、九环节核查漏斗、证据溯源、多语种交叉验证到人工审核结案的全流程。

> **AI 内核**:初筛/主张拆解/交叉验证/报告生成走真实 LLM(openai 模块多供应商路由);检索/出处追踪走 Tavily 联网搜索(需配置 `TAVILY_API_KEY`)。未启用的能力在各环节以「未启用」徽章如实标注,不伪装。

## ✨ 功能模块

| 模块 | 路由 | 说明 | 后端接口 |
|---|---|---|---|
| 登录 | `/login` | 账号密码登录，token 会话保持 | `POST /login` |
| 工作台 | `/workbench` | KPI 总览、待人工审核、九环节漏斗、信源可信度雷达、进行中案件、12 周趋势、24×7 热力图 | `GET /dashboard?range=` |
| 线索中心 | `/clues` | 新建线索并自动创建核查任务(推进至环节 2) | `POST /createClue` |
| 核查任务 | `/tasks` | 任务列表检索、筛选与状态追踪 | `GET /tasks` |
| 案件工作台 | `/cases/:caseId` | 九环节全流程：初筛→拆解→检索→出处→交叉→信源→报告→人工审核；支持单环节重算、一键自动核查、审核结案、删除 | `GET /cases/{no}` `POST /cases/{no}/pipeline` `POST /cases/{no}/reviews` `DELETE /cases/{no}` |
| 证据库 | `/evidence` | 证据材料归档与关联案件 | `GET /evidence` |
| 历史案例 | `/history` | 已结案案例与核查报告 | `GET /history` |
| 知识库 | `/knowledge` | 核查规范与素材沉淀 | `GET /knowledge` |
| 数据统计 | `/statistics` | 概况卡片、结论分布、环节流转、成员产出、来源平台 | `GET /statistics` |
| 用户管理 | `/users` | 成员增改、启停状态、操作审计日志 | `GET/POST /users` `PUT/DELETE /users/{id}` `GET /auditLogs` |

- **真实登录**：登录/鉴权走后端 Passport,token 全局存储于 `localStorage` 的 `x-token`;401 自动清理本地会话
- **接口级 RBAC**:管理员/审核员/核查员三角色;终审仅审核员+管理员、成员管理与案件删除仅管理员;操作人/审核人一律取服务端会话身份
- **统计全真实**:漏斗/热力图/周趋势/KPI/结论分布/成员产出全部由数据表实时聚合,无写死数字
- **URL 路由**：Hash 模式(`/#/workbench`),深链接可直接分享案件地址
- **响应式**：桌面固定侧边栏、移动端抽屉菜单;图表按容器宽度自适应

## 🛠 技术栈

- 前端：[React 19] + [TypeScript] + [Vite 8] + [Tailwind CSS 4] + [React Router v7] + [lucide-react],包管理 **pnpm**
- 后端：X-PHP `app/detective` 模块(Swoole 独立服务,端口 **9602**),复用 `user` 模块 Passport 登录鉴权
- 数据：MySQL(11 张 `detective_*` 表 + 演示种子数据)

## 🚀 快速开始

### 1. 启动后端(真探 detective 服务)

```bash
cd /path/to/hyperf

# 首次安装模块(建表 + 种子数据 + 注册应用)
php index.php app detective install --database=default

# 启动 detective 独立服务(端口 9602)
php index.php start detective
```

> 后端代码改动后需 `rm -rf runtime/container` 清 DI 缓存再重启。
> 演示账号:`zhangming@zhentan.org / Zt@2026Admin`(管理员)、`wangsisi@zhentan.org / Zt@2026Verify`(核查员,验证 RBAC 用)。
> 可选配置:`TAVILY_API_KEY`(联网搜索)、`DETECTIVE_AI_MODEL`(指定 LLM,默认跟随 openai 模块路由表)、`DETECTIVE_CORS_ALLOW_ORIGINS`(CORS 白名单,默认本机 3000 端口)。

### 2. 启动前端

```bash
cd /path/to/TrueDetective

pnpm install
pnpm dev        # http://localhost:3000
```

前端开发模式默认请求 `http://127.0.0.1:9602/api`,可通过 `.env.local` 覆盖：

```bash
VITE_API_BASE=http://127.0.0.1:9602/api   # 后端 API 地址(生产默认 /api)
VITE_ROUTER_MODE=history                  # 可选:干净 URL(需服务器 SPA fallback)
```

### 3. 构建发布

```bash
pnpm lint     # tsc --noEmit
pnpm build    # 产出 dist/
```

> 免登录直达:`http://localhost:3000/?autostart=1`(自动使用演示账号登录)。

## 🔌 API 约定

- Base URI:开发 `http://127.0.0.1:9602/api`,生产 `/api`
- 请求头:`Content-Type: application/json`,鉴权 `x-token: Bearer ${token}`
- 统一信封:`{ code, message, data }`;`200` 成功 / `201` 业务失败 / `401` 凭证失效 / `403` 无权限

## 📁 目录结构

```
TrueDetective/
├── index.html                  # 入口 HTML
├── vite.config.ts              # Vite 配置(路由分包)
└── src/
    ├── App.tsx                 # 路由表 + 登录守卫 + 仪表盘数据装配
    ├── api/
    │   ├── client.ts           # API 客户端(token/信封/接口列表)
    │   └── hooks.tsx           # useApiData + 加载/错误组件
    ├── components/
    │   ├── Sidebar.tsx / TopBar.tsx / Row1–Row4*.tsx
    │   └── views/              # 各路由视图 + 案件详情工作台
    ├── data/                   # 类型声明 + 图表加载兜底数据
    └── utils/
        ├── dashboardLogic.ts   # 过滤/热力图/雷达逻辑(含单测)
        └── useElementWidth.ts  # 图表宽度自适应 hook

hyperf/app/detective/           # 后端模块(独立仓库目录)
├── ConfigProvider.php          # 独立服务 9602 + 全局 CORS
├── Controller/Api.php          # trait 组合的 REST API
├── Controller/Api/*.php        # Dashboard/Clue/Task/Case/Evidence/... 分组
├── Service/CaseService.php     # 案件详情装配 + 九环节流水线模拟
├── Middleware/                 # CORS + 用户鉴权
└── Install/install.sql         # 建表 + 种子数据
```

## 📄 其他

- 工作台聚合指标(漏斗/雷达/热力图/12 周趋势)存于 `detective_stats` 表,案件/任务/证据/成员等列表均为数据库实时数据
- 流水线为模拟执行:后端按环节生成初筛、关键词、检索结果、证据、信源评价与报告并持久化,人工审核通过后结案归档
