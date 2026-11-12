export interface TaskItem {
  id: string;
  title: string;
  stageProgress: string; // "8/9" or "9/9"
  stageProgressNum: number;
  priority: '高' | '中' | '低';
  assignee: string; // "王思思" or "——"
  assigneeInitial: string;
  conclusion: '误导' | '无法核查' | '疑似AI生成' | '无法判断' | '基本真实' | '尚待核实' | '虚假' | '真实';
  status: '报告生成' | '已结案' | '进行中';
}

export const ALL_TASKS: TaskItem[] = [
  {
    id: 'ZT-2026-0017',
    title: '国防部新闻发言人吴谦就加拿大炒作“中国战机拦截加侦察机”答记者问',
    stageProgress: '8/9',
    stageProgressNum: 8,
    priority: '高',
    assignee: '王思思',
    assigneeInitial: '王',
    conclusion: '误导',
    status: '报告生成',
  },
  {
    id: 'ZT-2026-0016',
    title: '文本核查：外媒称中国边境管控构成“系统性限制”',
    stageProgress: '8/9',
    stageProgressNum: 8,
    priority: '中',
    assignee: '李华',
    assigneeInitial: '李',
    conclusion: '无法核查',
    status: '报告生成',
  },
  {
    id: 'ZT-2026-0015',
    title: 'Canadian military silent on Chinese intercepts during latest patrol flights',
    stageProgress: '9/9',
    stageProgressNum: 9,
    priority: '中',
    assignee: '——',
    assigneeInitial: '',
    conclusion: '误导',
    status: '已结案',
  },
  {
    id: 'ZT-2026-0014',
    title: 'BRICS 峰会领导人“自拍”图片溯源',
    stageProgress: '8/9',
    stageProgressNum: 8,
    priority: '高',
    assignee: '张明',
    assigneeInitial: '张',
    conclusion: '疑似AI生成',
    status: '报告生成',
  },
  {
    id: 'ZT-2026-0013',
    title: '加沙的童年：现场影像真实性核查',
    stageProgress: '8/9',
    stageProgressNum: 8,
    priority: '中',
    assignee: '王芳',
    assigneeInitial: '王',
    conclusion: '疑似AI生成',
    status: '报告生成',
  },
  {
    id: 'ZT-2026-0012',
    title: 'We Warned About the First China Shock. The Next One Will Be Worse.',
    stageProgress: '9/9',
    stageProgressNum: 9,
    priority: '中',
    assignee: '——',
    assigneeInitial: '',
    conclusion: '误导',
    status: '已结案',
  },
  {
    id: 'ZT-2026-0011',
    title: '广西洪灾无人机“空中吊人”救援视频核查',
    stageProgress: '8/9',
    stageProgressNum: 8,
    priority: '高',
    assignee: '赵强',
    assigneeInitial: '赵',
    conclusion: '无法判断',
    status: '报告生成',
  },
  {
    id: 'ZT-2026-0010',
    title: '图片核查：外媒发布“边境检查站”现场照片',
    stageProgress: '8/9',
    stageProgressNum: 8,
    priority: '中',
    assignee: '王芳',
    assigneeInitial: '王',
    conclusion: '疑似AI生成',
    status: '报告生成',
  },
  {
    id: 'ZT-2026-0009',
    title: 'Twenty-five dead after fire on cargo ship in eastern China',
    stageProgress: '9/9',
    stageProgressNum: 9,
    priority: '中',
    assignee: '——',
    assigneeInitial: '',
    conclusion: '基本真实',
    status: '已结案',
  },
  {
    id: 'ZT-2026-0008',
    title: '菲律宾海岸警卫队指责中国海警船在南海海警蓄意撞击非公务船',
    stageProgress: '9/9',
    stageProgressNum: 9,
    priority: '中',
    assignee: '——',
    assigneeInitial: '',
    conclusion: '尚待核实',
    status: '已结案',
  },
  {
    id: 'ZT-2026-0007',
    title: '菲防长首尔论坛邸所中方纸条：“赤裸裸的胁迫与霸凌”',
    stageProgress: '8/9',
    stageProgressNum: 8,
    priority: '中',
    assignee: '刘洋',
    assigneeInitial: '刘',
    conclusion: '误导',
    status: '报告生成',
  },
  {
    id: 'ZT-2026-0006',
    title: '中国疫情“全面失控”',
    stageProgress: '9/9',
    stageProgressNum: 9,
    priority: '中',
    assignee: '——',
    assigneeInitial: '',
    conclusion: '虚假',
    status: '已结案',
  },
  {
    id: 'ZT-2026-0005',
    title: '马德雷山号登陆舰将永久驻留在仁爱礁，绝不会拖走！',
    stageProgress: '9/9',
    stageProgressNum: 9,
    priority: '中',
    assignee: '——',
    assigneeInitial: '',
    conclusion: '误导',
    status: '已结案',
  },
  {
    id: 'ZT-2026-0004',
    title: '中菲合作抓获并遣返涉绑架、杀害中国公民的嫌疑人施纯芳',
    stageProgress: '9/9',
    stageProgressNum: 9,
    priority: '中',
    assignee: '——',
    assigneeInitial: '',
    conclusion: '真实',
    status: '已结案',
  },
  {
    id: 'ZT-2026-0003',
    title: '新华社涉疆报道事实核查专题',
    stageProgress: '8/9',
    stageProgressNum: 8,
    priority: '高',
    assignee: '李华',
    assigneeInitial: '李',
    conclusion: '真实',
    status: '报告生成',
  },
  {
    id: 'ZT-2026-0002',
    title: '战机拦截事件外交部例行记者会实录及外媒报道比对',
    stageProgress: '8/9',
    stageProgressNum: 8,
    priority: '中',
    assignee: '王思思',
    assigneeInitial: '王',
    conclusion: '基本真实',
    status: '报告生成',
  },
];

export interface EvidenceItem {
  id: number;
  caseId: string;
  name: string;
  sourceOrg: string;
  date: string;
  relation: '支持' | '反驳' | '背景' | '待确认';
  sourceType: '中方官方' | '中方媒体' | '国际媒体' | '外媒官方喉舌' | '事实核查机构' | '国际组织';
  credibility: '高' | '较高' | '中' | '低';
}

export const EVIDENCE_ITEMS: EvidenceItem[] = [
  {
    id: 1,
    caseId: 'ZT-2026-0001',
    name: '中国出入境管理法 (2024年修订版) 全文',
    sourceOrg: '全国人大常委会',
    date: '2024-06-28',
    relation: '支持',
    sourceType: '中方官方',
    credibility: '高',
  },
  {
    id: 2,
    caseId: 'ZT-2026-0001',
    name: '国家移民管理局: 出入境新规政策解读',
    sourceOrg: '国家移民管理局',
    date: '2026-07-05',
    relation: '支持',
    sourceType: '中方官方',
    credibility: '高',
  },
  {
    id: 3,
    caseId: 'ZT-2026-0001',
    name: '环球时报社评: 规范出入境就是“封闭”? 无稽之谈',
    sourceOrg: '环球时报',
    date: '2026-08-02',
    relation: '反驳',
    sourceType: '中方媒体',
    credibility: '较高',
  },
  {
    id: 4,
    caseId: 'ZT-2026-0001',
    name: 'CNN 报道: 中国新出入境规定实施细则公布',
    sourceOrg: 'CNN',
    date: '2026-08-10',
    relation: '背景',
    sourceType: '外媒官方喉舌',
    credibility: '中',
  },
  {
    id: 5,
    caseId: 'ZT-2026-0001',
    name: '人权观察 (HRW) 年度报告: 边境管控章节',
    sourceOrg: 'Human Rights Watch',
    date: '2026-01-15',
    relation: '待确认',
    sourceType: '国际组织',
    credibility: '中',
  },
  {
    id: 6,
    caseId: 'ZT-2026-0002',
    name: '外交部例行记者会实录 (2026年8月14日)',
    sourceOrg: '中华人民共和国外交部',
    date: '2026-08-14',
    relation: '支持',
    sourceType: '中方官方',
    credibility: '高',
  },
  {
    id: 7,
    caseId: 'ZT-2026-0002',
    name: '国防部新闻发言人回应实录',
    sourceOrg: '中华人民共和国国防部',
    date: '2026-08-15',
    relation: '支持',
    sourceType: '中方官方',
    credibility: '高',
  },
  {
    id: 8,
    caseId: 'ZT-2026-0002',
    name: '路透社: 中方就相关事件最新表态',
    sourceOrg: 'Reuters',
    date: '2026-08-15',
    relation: '背景',
    sourceType: '国际媒体',
    credibility: '较高',
  },
  {
    id: 9,
    caseId: 'ZT-2026-0002',
    name: 'VOA 报道: 渲染所谓“区域紧张”',
    sourceOrg: 'VOA 美国之音',
    date: '2026-08-16',
    relation: '背景',
    sourceType: '外媒官方喉舌',
    credibility: '低',
  },
  {
    id: 10,
    caseId: 'ZT-2026-0003',
    name: '新华社: 涉疆报道事实核查专题',
    sourceOrg: '新华社',
    date: '2026-07-20',
    relation: '支持',
    sourceType: '中方媒体',
    credibility: '较高',
  },
  {
    id: 11,
    caseId: 'ZT-2026-0003',
    name: '新疆维吾尔自治区人民政府新闻发布会',
    sourceOrg: '新疆自治区政府',
    date: '2026-07-22',
    relation: '支持',
    sourceType: '中方官方',
    credibility: '高',
  },
  {
    id: 12,
    caseId: 'ZT-2026-0003',
    name: '外媒转载对比: 原始报道与转述偏差分析',
    sourceOrg: 'FactCheck.org',
    date: '2026-07-25',
    relation: '反驳',
    sourceType: '事实核查机构',
    credibility: '高',
  },
];

export interface HistoryCase {
  id: string;
  conclusion: '误导' | '基本真实' | '尚待核实' | '虚假' | '真实';
  title: string;
  summary: string;
  evidenceCount: number;
  reviewRounds: number;
  confidence: '高' | '较高' | '中' | '低';
  closedDate: string;
}

export const HISTORY_CASES: HistoryCase[] = [
  {
    id: 'ZT-2026-0015',
    conclusion: '误导',
    title: 'Canadian military silent on Chinese intercepts during latest patrol flights',
    summary:
      '外媒以“加军对中方拦截保持沉默”为标题，暗示中方行为缺乏依据；查证显示拦截程序由加方巡逻航线触发，报道省略关键背景。',
    evidenceCount: 5,
    reviewRounds: 2,
    confidence: '高',
    closedDate: '2026-09-24',
  },
  {
    id: 'ZT-2026-0012',
    conclusion: '误导',
    title: 'We Warned About the First China Shock. The Next One Will Be Worse.',
    summary:
      '评论文章以“第二次中国冲击”为框架，引用数据省略年份与口径；比对后发现其引用对象为历史峰值，与现行情况不符。',
    evidenceCount: 4,
    reviewRounds: 1,
    confidence: '较高',
    closedDate: '2026-09-23',
  },
  {
    id: 'ZT-2026-0009',
    conclusion: '基本真实',
    title: 'Twenty-five dead after fire on cargo ship in eastern China',
    summary:
      '事故时间、地点、伤亡人数与官方通报一致；报道对原因的表述使用“疑似”，属合理保留，不构成误导。',
    evidenceCount: 3,
    reviewRounds: 1,
    confidence: '高',
    closedDate: '2026-09-22',
  },
  {
    id: 'ZT-2026-0008',
    conclusion: '尚待核实',
    title: '菲律宾海岸警卫队指责中国海警船在南海海警蓄意撞击非公务船',
    summary:
      '双方各执影像证据且表达冲突，缺少第三方现场记录；证据链不足，按规范输出“尚待核实”而非强下结论。',
    evidenceCount: 2,
    reviewRounds: 3,
    confidence: '低',
    closedDate: '2026-09-22',
  },
  {
    id: 'ZT-2026-0006',
    conclusion: '虚假',
    title: '中国疫情“全面失控”',
    summary:
      '报道所称“医疗系统全面崩溃”无任何官方或独立数据支撑，且与同期公开数据相反，判定为虚假。',
    evidenceCount: 4,
    reviewRounds: 2,
    confidence: '高',
    closedDate: '2026-09-20',
  },
  {
    id: 'ZT-2026-0004',
    conclusion: '真实',
    title: '中菲合作抓获并遣返涉绑架、杀害中国公民的嫌疑人施纯芳',
    summary:
      '两国执法部门通报一致，时间、人物、处置结果均可交叉验证，属事实层完整核实。',
    evidenceCount: 3,
    reviewRounds: 1,
    confidence: '高',
    closedDate: '2026-09-20',
  },
  {
    id: 'ZT-2026-0005',
    conclusion: '误导',
    title: '马德雷山号登陆舰将永久驻留在仁爱礁，绝不会拖走！',
    summary:
      '“永久驻留”为单方表态，非法事实；报道将其作为既定事实陈述，省略主权争议背景，构成误导。',
    evidenceCount: 3,
    reviewRounds: 2,
    confidence: '较高',
    closedDate: '2026-09-18',
  },
];

export interface KnowledgeItem {
  id: number;
  category: '核查规范' | '核查方法' | '信源分级' | '典型案例';
  title: string;
  citations: number;
  content: string;
  keyRule: string;
  updatedDate: string;
}

export const KNOWLEDGE_ITEMS: KnowledgeItem[] = [
  {
    id: 1,
    category: '核查规范',
    title: '结论分类定义 (8 类)',
    citations: 128,
    content:
      '真实 / 基本真实 / 部分属实 / 误导 / 基本错误 / 虚假 / 尚待核实 / 无法核查。证据不足时不得降档下定论。',
    keyRule: '· 8 类结论互斥，不设中间档\n· 证据链低于 70% 只能出尚待核实',
    updatedDate: '2026-10-28',
  },
  {
    id: 2,
    category: '核查规范',
    title: '指控表述核查主线',
    citations: 96,
    content:
      '外媒报道的指控、定性、断言 (如“常态化治理工具”“监狱”) 须作为核查主线，独立判定是否有证据支撑，不得与政策事实混为一谈。',
    keyRule: '· 区分“政策存在”与“性质定性”\n· 定性表述需独立佐证',
    updatedDate: '2026-10-21',
  },
  {
    id: 3,
    category: '核查规范',
    title: '证据分类',
    citations: 84,
    content:
      '四类归位: 支持证据 / 反驳证据 (必须主动检索，防确认偏误) / 背景证据 (不能单独替代直接证据) / 待确认证据。',
    keyRule: '· 转载不计独立证据\n· 反驳证据缺失即提示完整性不足',
    updatedDate: '2026-10-18',
  },
  {
    id: 4,
    category: '核查规范',
    title: '多语种检索要点',
    citations: 72,
    content:
      '同一条主张按中英文关键词分别检索；区分独立信源与转引信源；转载、摘编、二次编译不计为独立证据。',
    keyRule: '· 至少 2 种语言交叉检索\n· 同一稿件多平台发布视为 1 条',
    updatedDate: '2026-10-16',
  },
  {
    id: 5,
    category: '核查方法',
    title: '关键词生成规则',
    citations: 88,
    content:
      '关键词须覆盖指控对象的核心用语 (“边境管控”“监狱”“人权组织”)，中英分别，不用泛指词，按“争议点”构造检索方向。',
    keyRule: '· 争议点 + 关键词 = 检索式\n· 避免直接拿结论词',
    updatedDate: '2026-10-14',
  },
  {
    id: 6,
    category: '核查方法',
    title: '旧图新用识别',
    citations: 81,
    content:
      '对图片做反向检索，比对最早出现时间与当前所指时间；能查到更早出处即认定为非现场证据，按旧图新用结论处理。',
    keyRule: '· 反向识图比对最早发布时间线\n· 附出处认定非现场证据',
    updatedDate: '2026-10-09',
  },
  {
    id: 7,
    category: '核查方法',
    title: '视频截帧与逐帧比对',
    citations: 68,
    content:
      '按 1 秒间隔截帧，抽帧后比对光影、阴影方向、天气与服饰细节；跨帧不一致或物理光照冲突即标注疑点。',
    keyRule: '· 关键帧至少 12 帧\n· 光照、阴影为 24 小时判断依据',
    updatedDate: '2026-10-06',
  },
  {
    id: 8,
    category: '信源分级',
    title: '信源评价六维度',
    citations: 58,
    content:
      '按“接近事件程度、专业性、涉华表述准确性、立场倾向、透明度、时效性”六维打分；同一机构不同栏目可分别评分。',
    keyRule: '· 涉华表述准确性权重最高\n· 分级每 24 小时刷新',
    updatedDate: '2026-10-06',
  },
  {
    id: 9,
    category: '信源分级',
    title: '外媒官方喉舌识别',
    citations: 52,
    content:
      '政府资助、官方口径媒体归为外媒官方喉舌，引用时须标红提示，并要求附反驳证据或独立佐证，不得单独支撑结论。',
    keyRule: '· 引用自动打标签\n· 需至少 1 条独立佐证',
    updatedDate: '2026-09-30',
  },
  {
    id: 10,
    category: '信源分级',
    title: '官方文件使用边界',
    citations: 47,
    content:
      '官方文件只支持事实层面结论 (如“新规已发布”)，不得据以推断动机与性质；引用须标明文号、发布日期与发布机构。',
    keyRule: '· 事实层 / 定性层分开\n· 引文需完整可回溯',
    updatedDate: '2026-09-28',
  },
  {
    id: 11,
    category: '典型案例',
    title: '案例: 出入境新规与人权组织指控',
    citations: 41,
    content:
      '人权组织将新规描述为“常态化治理工具”，被渲染为“数以万人的监狱”。核查结论: 事实层 (新规发布) 属实，指控层缺乏支撑，结论“误导 / 尚待核实”。',
    keyRule: '· 教学用法: 事实层与定性层分离\n· 关联案件 ZT-2026-0001',
    updatedDate: '2026-09-28',
  },
  {
    id: 12,
    category: '典型案例',
    title: '案例: 旧图新用类谣言',
    citations: 34,
    content:
      '某外媒将数年前旧照片配文为近期事件。反向识图比对最早发布时间后判定“虚假”，并附原始出处时间线。',
    keyRule: '· 教学用法: 识别溯源流程\n· 关联案件 ZT-2026-0005',
    updatedDate: '2026-09-24',
  },
];

export interface TeamMember {
  id: number;
  name: string;
  title: string;
  handle: string;
  role: '管理员' | '审核员' | '核查员';
  department: string;
  email: string;
  status: '启用' | '停用';
  lastActive: string;
  avatarChar: string;
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: 1,
    name: '张明',
    title: '工作室负责人',
    handle: '@zhangming',
    role: '管理员',
    department: '真探工作室',
    email: 'zhangming@zhentan.cn',
    status: '启用',
    lastActive: '2026-09-20 09:12',
    avatarChar: '张',
  },
  {
    id: 2,
    name: '李华',
    title: '一线核查',
    handle: '@lihua',
    role: '核查员',
    department: '分析组',
    email: 'lihua@zhentan.cn',
    status: '启用',
    lastActive: '2026-09-20 08:45',
    avatarChar: '李',
  },
  {
    id: 3,
    name: '王芳',
    title: '涉华舆情',
    handle: '@wangfang',
    role: '核查员',
    department: '分析组',
    email: 'wangfang@zhentan.cn',
    status: '启用',
    lastActive: '2026-09-19 17:30',
    avatarChar: '王',
  },
  {
    id: 4,
    name: '赵强',
    title: '终审定论',
    handle: '@zhaoqiang',
    role: '审核员',
    department: '审核组',
    email: 'zhaoqiang@zhentan.cn',
    status: '启用',
    lastActive: '2026-09-19 16:05',
    avatarChar: '赵',
  },
  {
    id: 5,
    name: '陈静',
    title: '休假中',
    handle: '@chenjing',
    role: '核查员',
    department: '分析组',
    email: 'chenjing@zhentan.cn',
    status: '停用',
    lastActive: '2026-09-10 11:20',
    avatarChar: '陈',
  },
  {
    id: 6,
    name: '刘洋',
    title: '重大案例复核',
    handle: '@liuyang',
    role: '审核员',
    department: '审核组',
    email: 'liuyang@zhentan.cn',
    status: '启用',
    lastActive: '2026-09-18 14:40',
    avatarChar: '刘',
  },
];

export interface AuditLogItem {
  id: number;
  time: string;
  member: string;
  action: string;
  target: string;
  result: '成功' | '需复核';
}

export const AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 1,
    time: '09-20 09:12',
    member: '张明',
    action: '编辑知识条目',
    target: '结论分类定义 (8 类)',
    result: '成功',
  },
  {
    id: 2,
    time: '09-20 09:05',
    member: '赵强',
    action: '终审定论',
    target: 'ZT-2026-0015 · 误导',
    result: '成功',
  },
  {
    id: 3,
    time: '09-19 17:30',
    member: '王芳',
    action: '提交线索',
    target: 'ZT-2026-0021 边境检查站照片',
    result: '成功',
  },
  {
    id: 4,
    time: '09-19 16:05',
    member: '李华',
    action: '推进环节 8 -> 9',
    target: 'ZT-2026-0016 · 文本核查',
    result: '成功',
  },
  {
    id: 5,
    time: '09-19 11:20',
    member: '刘洋',
    action: '删除证据',
    target: 'ZT-2026-0009 · 重复转载条目',
    result: '需复核',
  },
];
