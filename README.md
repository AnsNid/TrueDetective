<div align="center">

# 海外涉华信息智能核查平台

求真 · 求证 · 求实

</div>

---

面向核查工作台的全栈应用：前端 React SPA + 后端 X-PHP `detective` 独立服务，覆盖线索接入、九环节核查漏斗、证据溯源、多语种交叉验证到人工审核结案的全流程。

> **AI 内核**:初筛/主张拆解/交叉验证/报告生成走真实 LLM(openai 模块多供应商路由);检索/出处追踪走 Tavily 联网搜索(需配置 `TAVILY_API_KEY`)。未启用的能力在各环节以「未启用」徽章如实标注,不伪装。

## ✨ 功能模块

| 模块 | 路由 | 说明 | 后端接口 |
|---|---|---|---|
| 登录 | `/login` | 账号密码登录，token 会话保持 | `POST /login` |
| 工作台 | `/workbench` | KPI 总览、待人工审核、九环节漏斗、信源可信度雷达、进行中案件、12 周趋势、24×7 热力图 | `GET /dashboardMetrics?range=` `GET /dashboardOverview` `GET /dashboardCharts`(三路并行) |
| 线索中心 | `/clues` | 新建线索并自动创建核查任务(推进至环节 2);案件编号按年递增,形如 `FC-2026-0017`,前缀为中性缩写占位、可用后端 `DETECTIVE_CASE_NO_PREFIX` 覆盖(最终前缀待定) | `POST /createClue` |
| 核查任务 | `/tasks` | 任务列表检索、筛选与状态追踪 | `GET /tasks` |
| 案件工作台 | `/cases/:caseId` | 九环节全流程：初筛→拆解→检索→出处→交叉→信源→报告→人工审核；支持单环节重算、一键自动核查、**四级串行审核(成员→部长→负责人→超管)**、驳回回退报告修改与重新提交、报告 AI 文本页面编辑、**PDF/Word 双格式导出**、删除 | `GET /cases/{no}` `POST /cases/{no}/pipeline` `POST /cases/{no}/reviews` `PUT /cases/{no}/report` `POST /cases/{no}/submitReport` `GET /cases/{no}/export?format=pdf\|docx` `DELETE /cases/{no}` |
| 证据库 | `/evidence` | 证据材料归档与关联案件 | `GET /evidence` |
| 历史案例 | `/history` | 已结案案例与核查报告 | `GET /history` |
| 知识库 | `/knowledge` | 核查规范与素材沉淀 | `GET /knowledge` |
| 数据统计 | `/statistics` | 概况卡片、结论分布、环节流转、成员产出、来源平台 | `GET /statistics` |
| 用户管理 | `/users` | 双体系成员增改、启停状态、批量导入学生、操作审计日志 | `GET/POST /users` `PUT/DELETE /users/{id}` `POST /importStudents` `GET /auditLogs` |

- **真实登录**：登录/鉴权走后端 Passport,token 全局存储于 `localStorage` 的 `x-token`;401 自动清理本地会话
- **双角色体系 RBAC**(服务端为唯一事实源,前端菜单/路由/按钮按下发权限过滤):
  - **工作室体系**:`super_admin`(超级管理员/总编,双体系全部数据,可越级审)/`studio_lead`(工作室负责人,全部功能)/`minister`(部长,无用户管理)/`member`(成员,无用户管理与统计看板,参与审核);人工审核=四级串行流(成员①→部长②→负责人③→超管④,超管可越级代审,驳回回退报告修改后从头重审);删除案件/知识库=总编+负责人
  - **教学体系**:`teacher`(授课老师/实验员)与 `student`(学生)仅可新建任务、查看已核查案例、任务列表/详情;老师可见全部教学任务,学生仅见本人新建;两套体系数据互不可见(总编除外)
  - **教学注册**:登录页「学生注册」自助注册(学号/工号纯数字+姓名+密码+**邮箱验证码先行校验**,邮箱绑定后可自助找回密码);用户管理页支持粘贴「学号 姓名」批量导入,随机初始密码仅显示一次并可导出 CSV;学号+密码登录
  - **找回/修改密码**:工作室邮箱账号走登录页「忘记密码」邮箱验证码自助重置(mail 模块 SMTP,验证码 10 分钟有效、60 秒防刷);教学学号账号由总编/负责人在用户管理页「重置密码」(留空随机生成,仅显示一次);登录用户可在顶栏用户菜单「修改密码」(验旧改新,成功后重新登录)
  - **操作审计**:登录、提交线索、流水线推进、分级审核/驳回/重新提交、编辑报告、导出报告、案例沉淀、删除、用户增删改、批量导入、密码重置/修改/自助找回全量记入审计日志(用户管理页可查最近 100 条)
  - **报告导出**:PDF(dompdf)与 Word(PhpWord)双版本,纯报告内容(无水印/单位落款/审核签字位),产物落 `runtime/export/` 固定名覆盖。PDF 中文字体用 `storage/fonts/zh.ttf`(+`zh-bold.ttf`,不入库)——**Arial Unicode.ttf 因 cmap 过旧会渲染乱码,已弃用**;部署机可用 fonttools 从系统宋体提取:`python3 -m pip install fonttools` 后执行 `python3 -c "from fontTools.ttLib import TTCollection;t=TTCollection('/System/Library/Fonts/Supplemental/Songti.ttc');n=[f['name'].getDebugName(4) for f in t.fonts];t.fonts[n.index('Songti SC Regular')].save('storage/fonts/zh.ttf');t.fonts[n.index('Songti SC Bold')].save('storage/fonts/zh-bold.ttf')"`
- **统计全真实**:漏斗/热力图/周趋势/KPI/结论分布/成员产出全部由数据表实时聚合,无写死数字
- **URL 路由**：Hash 模式(`/#/workbench`),深链接可直接分享案件地址
- **响应式**：桌面固定侧边栏、移动端抽屉菜单;图表按容器宽度自适应

## 🛠 技术栈

- 前端：[React 19] + [TypeScript] + [Vite 8] + [Tailwind CSS 4] + [React Router v7] + [lucide-react],包管理 **pnpm**
- 后端：X-PHP `app/detective` 模块(Swoole 独立服务,端口 **9602**),复用 `user` 模块 Passport 登录鉴权
- 数据：MySQL(11 张 `detective_*` 表 + 演示种子数据)

## 🚀 快速开始

### 1. 启动后端(detective 服务)

```bash
cd /path/to/hyperf

# 首次安装模块(建表 + 种子数据 + 注册应用)
php index.php app detective install --database=default

# 启动 detective 独立服务(端口 9602)
php index.php start detective
```

> 后端代码改动后需 `rm -rf runtime/container` 清 DI 缓存再重启。存量库升级执行 `app/detective/Install/upgrade_20261117.sql`(表前缀 `#@_` 需替换为实际前缀)。
> 演示账号(工作室):`zhangming@zhentan.org / Zt@2026Admin`(总编)、`wangsisi@zhentan.org / Zt@2026Verify`(成员)。
> 演示账号(教学):`10001 / Zt@2026Teach`(授课老师)、`20260001 / Zt@2026Stu`(学生)。
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
