export interface CaseClaim {
  id: number;
  text: string;
  type: 'allegation' | 'fact' | 'view' | 'emotion';
  elements: Record<string, string>;
}

export interface CaseEvidence {
  id: number;
  name: string;
  source_org: string;
  source_type: string;
  publish_date: string;
  url: string;
  relation: '支持' | '反驳' | '背景' | '待确认' | '溯源';
  reliability: string;
  note: string;
  is_independent?: number;
}

export interface SourceEvaluation {
  evidence_id: number;
  name: string;
  source_org: string;
  dimensions: {
    接近事件程度: string;
    专业性: string;
    涉华表述准确性: string;
    立场与倾向性: string;
    透明度: string;
    时效性: string;
  };
  grade: 'A' | 'B' | 'C';
  reason: string;
}

export interface RunningLogEntry {
  stage: number;
  name: string;
  ok: boolean;
  detail: string;
}

export interface ReviewRecord {
  id: number;
  reviewer: string;
  action: 'approved' | 'revised' | 'returned';
  comment: string;
  check_items: string[];
  reviewed_at: string;
}

export interface FullCaseDetail {
  id: number;
  case_no: string;
  title: string;
  status: 'received' | 'running' | 'reporting' | 'reviewing' | 'done';
  stage: number;
  stage_name: string;
  priority: '高' | '中' | '低';
  assignee: string;
  final_conclusion: string;
  created_at?: string;
  screening_result: {
    passed: boolean;
    score: number;
    hit_keywords: string[];
    reason: string;
    focus: string;
    method: string;
    checked_at: string;
    image_analysis?: {
      scene_description: string;
      text_in_image: string;
      authenticity_clues: string[];
      suspected: 'real_scene' | 'ai_generated' | 'ps_edited' | 'old_image_reuse' | 'unclear';
      reason: string;
      transcript: string;
    };
  };
  keywords: {
    zh?: string;
    en?: string;
    zh_official?: string;
    zh_media?: string;
    en_west?: string;
  };
  search_results: Array<{
    title: string;
    url: string;
    snippet: string;
    source: string;
    date: string;
    type: string;
    origin?: string;
  }>;
  trace_results: Array<{
    matched_title?: string;
    matched_site?: string;
    url?: string;
    note?: string;
    published_date?: string;
    warning?: boolean;
  }>;
  verification_results?: {
    claim_count: number;
    evidence_count: number;
    independent_count: number;
    relation_stats: Record<string, number>;
    warning?: string;
  };
  source_evals: SourceEvaluation[];
  running_log: RunningLogEntry[];
  clue: {
    id: number;
    clue_no: string;
    title: string;
    content_type: string;
    raw_text: string;
    translated_text: string;
    source_platform: string;
    source_account: string;
    source_link: string;
    published_at: string;
    submitted_by: string;
    media_path: string;
    image_url: string;
  };
  claims: CaseClaim[];
  evidence: CaseEvidence[];
  report?: {
    id: number;
    preliminary_conclusion: string;
    summary: string;
    conclusion: string;
    confidence: string;
    evidence_table: Array<{
      name: string;
      source: string;
      date: string;
      relation: string;
      reliability: string;
      url: string;
      grade?: string;
    }>;
    source_links: Array<{
      title: string;
      url: string;
      source?: string;
    }>;
    gaps: string[];
    pending_items: string[];
    generated_at: string;
  };
  reviews: ReviewRecord[];
}

export const INITIAL_CASE_DETAILS: Record<string, FullCaseDetail> = {
  'ZT-2026-0017': {
    id: 47,
    case_no: 'ZT-2026-0017',
    title: '国防部新闻发言人吴谦就加拿大炒作“中国战机拦截加侦察机”答记者问',
    status: 'reporting',
    stage: 8,
    stage_name: '报告生成',
    priority: '中',
    assignee: '王思思',
    final_conclusion: '误导',
    screening_result: {
      passed: true,
      score: 95,
      hit_keywords: ['中国', '威胁', '台湾'],
      reason:
        '线索直接涉及中国与加拿大的军事对峙事件，属于涉华军事活动高发领域，且有具体事件细节和官方回应，必须进入事实核查。',
      focus: '涉华军事活动',
      method: 'llm',
      checked_at: '2026-09-24T11:26:20.430547',
    },
    keywords: {
      zh: '加拿大军机 中国 拦截 不安全 不专业 加防长',
      en: 'Canadian military plane intercepted by Chinese jet unsafe unprofessional',
      zh_official: '加拿大军机 拦截 中方回应 国防部 吴谦 驳斥 声明',
      zh_media: '加拿大军机 拦截 新华社 环球时报 报道',
      en_west: 'Canada military aircraft intercepted China unsafe unprofessional condemn',
    },
    search_results: [
      {
        title: '国防部新闻发言人吴谦就加拿大炒作“中国战机拦截加侦察机”答记者问',
        url: 'http://www.mod.gov.cn/gfbw/xwfyr/16259675.html',
        snippet:
          '记者：据报道，加拿大军方官员10月16日称，1架加武装部队侦察机在中国附近国际空域执行任务时，遭中方军机拦截，加防长称中方行为“不安全、不专业”。',
        source: '国防部',
        date: '2023-10-18',
        type: '搜索结果',
        origin: 'cn_official',
      },
      {
        title: '加拿大炒作中加军机相遇事件国防部、外交部双双回应',
        url: 'https://ca.china-embassy.gov.cn/zjwl/2023zjwl/202206/t20220607_10699403.htm',
        snippet:
          '吴谦表示，近期，加拿大军机以执行联合国安理会决议为借口，加大对中方抵近侦察并挑衅，危害中国国家安全，危及双方一线人员安全，中方对此表示坚决反对。',
        source: '中国驻加拿大大使馆',
        date: '2022-06-07',
        type: '搜索结果',
        origin: 'cn_official',
      },
    ],
    trace_results: [
      {
        matched_title: '反向识图未执行',
        matched_site: '系统提示',
        url: '',
        note: '纯文本线索，无需反向搜图。',
      },
    ],
    verification_results: {
      claim_count: 2,
      evidence_count: 8,
      independent_count: 8,
      relation_stats: { 背景: 6, 待确认: 2 },
      warning: '已发现多个独立来源，可进入信源评价。',
    },
    source_evals: [
      {
        evidence_id: 318,
        name: '国防部新闻发言人吴谦就加拿大炒作“中国战机拦截加侦察机”答 ...',
        source_org: '国防部',
        dimensions: {
          接近事件程度: '高',
          专业性: '高',
          涉华表述准确性: '高',
          立场与倾向性: '高',
          透明度: '高',
          时效性: '高',
        },
        grade: 'A',
        reason:
          '中方官方信源发布的事实性声明，直接回应涉华事件，表述准确，立场正当，方法透明，符合最高质量标准。',
      },
      {
        evidence_id: 319,
        name: '加拿大炒作中加军机相遇事件国防部、外交部双双回应',
        source_org: '中国驻加拿大大使馆',
        dimensions: {
          接近事件程度: '高',
          专业性: '高',
          涉华表述准确性: '高',
          立场与倾向性: '高',
          透明度: '高',
          时效性: '高',
        },
        grade: 'A',
        reason:
          '中方官方信源发布的针对涉华事件的正式回应，事实表述准确、立场代表国家，流程规范，透明度高。',
      },
    ],
    running_log: [
      { stage: 2, name: '价值初筛', ok: true, detail: '得分95，通过' },
      { stage: 3, name: '主张拆解', ok: true, detail: '拆解 2 项主张' },
      { stage: 4, name: '多语种检索', ok: true, detail: '检索到 7 条结果' },
      { stage: 5, name: '出处追踪', ok: true, detail: '溯源 0 条' },
      { stage: 6, name: '交叉验证', ok: true, detail: '证据 8 条，独立来源 8 个' },
      { stage: 7, name: '信源评价', ok: true, detail: '评价 8 个信源' },
      { stage: 8, name: '报告生成', ok: true, detail: '结论：误导' },
    ],
    clue: {
      id: 47,
      clue_no: 'CLUE-20260924-003',
      title: '国防部新闻发言人吴谦就加拿大炒作“中国战机拦截加侦察机”答记者问',
      content_type: 'text',
      raw_text:
        '记者：据报道，加拿大军方官员10月16日称，1架加武装部队侦察机在中国附近国际空域执行任务时，遭中方军机拦截，加防长称中方行为“不安全、不专业”。请问中方对此有何评论？\n\n吴谦：近日，加拿大空军1架CP-140型机多次侵入中国赤尾屿领空并抵近我华东沿海、进入台湾海峡侦察滋扰，中国空军依据中国法律和有关国际规则，对其实施查证识别、跟踪监视、警告驱离等管控措施，处置行动完全合理合法、专业规范。加方有关炒作罔顾事实，意在混淆国际视听。钓鱼岛及其附属岛屿是中国固有领土，加方行径严重侵犯中国主权，威胁中国国家安全，极易造成误解误判，性质恶劣、十分危险。中方对此予以强烈谴责，并向加方提出严正交涉。',
      translated_text: '该文本为中文官方实录，已保留完整上下文。',
      source_platform: '国防部官网',
      source_account: '@mod_china',
      source_link: 'http://www.mod.gov.cn/gfbw/xwfyr/16259675.html',
      published_at: '2023-10-18 10:00',
      submitted_by: '张明',
      media_path: '',
      image_url: '',
    },
    claims: [
      {
        id: 159,
        text: '加拿大军方官员称，1架加武装部队侦察机在中国附近国际空域执行任务时，遭中方军机拦截，加防长称中方行为“不安全、不专业”。',
        type: 'allegation',
        elements: {
          '人物/主体': '加拿大军方官员/加防长',
          地点: '中国附近国际空域',
          时间: '10月16日',
          事件: '中方军机拦截加侦察机',
          定性用语: '不安全、不专业',
        },
      },
      {
        id: 160,
        text: '10月16日，加拿大军方官员称，1架加武装部队侦察机在中国附近国际空域执行任务时，遭中方军机拦截。',
        type: 'fact',
        elements: {
          '人物/主体': '加拿大军方官员',
          地点: '中国附近国际空域',
          时间: '10月16日',
          事件: '加侦察机遭中方军机拦截',
          定性用语: '',
        },
      },
    ],
    evidence: [
      {
        id: 318,
        name: '国防部新闻发言人吴谦就加拿大炒作“中国战机拦截加侦察机”答记者问',
        source_org: '国防部',
        source_type: '中方官方',
        publish_date: '2023-10-18',
        url: 'http://www.mod.gov.cn/gfbw/xwfyr/16259675.html',
        relation: '支持',
        reliability: '高',
        note: '处置行动完全合理合法、专业规范。加方有关炒作罔顾事实，意在混淆国际视听。',
        is_independent: 1,
      },
      {
        id: 319,
        name: '加拿大炒作中加军机相遇事件国防部、外交部双双回应',
        source_org: '中国驻加拿大大使馆',
        source_type: '中方官方',
        publish_date: '2022-06-07',
        url: 'https://ca.china-embassy.gov.cn/zjwl/2023zjwl/202206/t20220607_10699403.htm',
        relation: '支持',
        reliability: '高',
        note: '加拿大军机以执行联合国安理会决议为借口，加大对中方抵近侦察并挑衅，危害中国国家安全。',
        is_independent: 1,
      },
    ],
    report: {
      id: 36,
      preliminary_conclusion:
        '指控层：加拿大军方及防长称中方战机拦截行为“不安全、不专业”，该定性缺乏独立证据支撑，且与中方官方声明（处置“完全合理合法、专业规范”）直接矛盾，构成夸大和误导性框架。事实层：加方侦察机确实遭到中方军机拦截，但加方所称“中国附近国际空域”与中方指出的“侵入中国赤尾屿领空、抵近华东沿海侦察”存在关键语境差异，加方表述刻意模糊空间属性，属于以事实片段植入无据定性。',
      summary:
        '本案核查加拿大军方关于“中国战机拦截加侦察机”的指控。指控层上，加方称中方行为“不安全、不专业”，但除加方单方面声明外，无独立第三方证据支持该定性；中方国防部、外交部及驻加使馆均明确表示中方处置“依法依规、专业规范”，并指出加方军机侵入中国领空、抵近侦察在先。综合判断，加方以“拦截”事实为背景，植入无证据支撑的“不安全、不专业”定性，构成误导。',
      conclusion: '误导',
      confidence: '高',
      evidence_table: [
        {
          name: '国防部新闻发言人吴谦就加拿大炒作“中国战机拦截加侦察机”答记者问',
          source: '国防部',
          date: '2023-10-18',
          relation: '支持',
          reliability: '高',
          url: 'http://www.mod.gov.cn/gfbw/xwfyr/16259675.html',
          grade: 'A',
        },
        {
          name: '加拿大炒作中加军机相遇事件国防部、外交部双双回应',
          source: '中国驻加拿大大使馆',
          date: '2022-06-07',
          relation: '支持',
          reliability: '高',
          url: 'https://ca.china-embassy.gov.cn/zjwl/2023zjwl/202206/t20220607_10699403.htm',
          grade: 'A',
        },
      ],
      source_links: [
        {
          title: '国防部新闻发言人吴谦就加拿大炒作“中国战机拦截加侦察机”答记者问',
          url: 'http://www.mod.gov.cn/gfbw/xwfyr/16259675.html',
          source: '国防部',
        },
      ],
      gaps: [
        '缺少加拿大军方发布的一手声明原文或独立第三方（如国际民航组织）对拦截事件的调查报告。',
        '缺乏事发时飞行轨迹、ADS-B数据或现场视频等客观证据以验证双方对事发空域的描述。',
      ],
      pending_items: [
        '需人工核实加军机具体飞行航线及与中国领空的距离。',
        '需确认加方“不安全、不专业”指控是否提供过任何技术证据。',
      ],
      generated_at: '2026-09-24T11:29:08.760803',
    },
    reviews: [
      {
        id: 15,
        reviewer: '李华',
        action: 'approved',
        comment: '信源交叉验证完毕，中方声明事实清晰，定性为误导合理。',
        check_items: ['打开原始账号核对发布日期', '确认传播语境是否暗示近期事件', '补充中文官方信源'],
        reviewed_at: '2026-09-24 14:20:00',
      },
    ],
  },
  'ZT-2026-0014': {
    id: 44,
    case_no: 'ZT-2026-0014',
    title: 'BRICS 峰会领导人“自拍”图片溯源',
    status: 'reporting',
    stage: 8,
    stage_name: '报告生成',
    priority: '高',
    assignee: '张明',
    final_conclusion: '疑似AI生成',
    screening_result: {
      passed: true,
      score: 85,
      hit_keywords: ['China'],
      reason: '涉及中国领导人出席金砖峰会，属涉华重大外交活动，含可核查事实。',
      focus: '涉华外交活动',
      method: 'llm',
      checked_at: '2026-09-23T07:24:05.273561',
      image_analysis: {
        scene_description:
          '画面为一群人像合影，采用类似自拍的近距离广角构图：前排左侧为普京，其右为莫迪竖拇指，后排可见习近平、沙特王储、埃尔多安等。背景为黑色背板，金色文字标语。',
        text_in_image: 'BRICS SUMMIT STRONGER TOGETHER FOR A BRIGHTER TOMORROW',
        authenticity_clues: [
          '标语并非金砖国家领导人会晤的官方主题表述，背板排版亦与历届会务视觉不符',
          '普京疑似持机自拍，但画面中看不到手机边缘与握持的手部结构，取景角度与手臂关系不自然',
          '人物面部高光、肤质与背景受光方向一致性可疑，存在典型AI生成拼接感',
          '背景国旗尺寸小、细节模糊变形，旗杆与旗面纹理异常',
        ],
        suspected: 'ai_generated',
        reason: '该图将多位领导人凑成自拍合影，持机手部缺失、光照与旗帜细节存在典型AI生成痕迹。',
        transcript: '金砖峰会自拍合影，包含多国领导人像。',
      },
    },
    keywords: {
      zh: '金砖峰会 领导人自拍 普京 莫迪 习近平 AI生成',
      en: 'BRICS summit leaders selfie AI generated',
    },
    search_results: [],
    trace_results: [
      {
        matched_site: 'Instagram',
        matched_title: 'One selfie. Multiple world powers. BRICS...',
        published_date: 'Sep 12, 2026',
        url: 'https://www.instagram.com/p/DdMdGdeixXu/',
        note: '社交平台娱乐帖，无任何官方通讯社发稿。',
      },
    ],
    source_evals: [],
    running_log: [
      { stage: 2, name: '价值初筛', ok: true, detail: '得分85，通过' },
      { stage: 3, name: '主张拆解', ok: true, detail: '纯图片线索：跳过文本主张拆解，聚焦图片真实性核查' },
      { stage: 4, name: '多语种检索', ok: true, detail: '纯图片线索：跳过文本检索' },
      { stage: 5, name: '出处追踪', ok: true, detail: '溯源 8 条' },
      { stage: 6, name: '交叉验证', ok: true, detail: '纯图片线索：跳过文本证据矩阵' },
      { stage: 7, name: '信源评价', ok: true, detail: '纯图片线索：跳过文本信源评价' },
      { stage: 8, name: '报告生成', ok: true, detail: '图片判定：疑似AI生成' },
    ],
    clue: {
      id: 44,
      clue_no: 'CLUE-20260923-003',
      title: 'BRICS 峰会领导人“自拍”图片溯源',
      content_type: 'image',
      raw_text: '画面为一群多国领导人自拍合影，背景为金砖峰会标识。',
      translated_text: '',
      source_platform: 'Instagram',
      source_account: '@global_watch',
      source_link: '',
      published_at: '2026-09-12',
      submitted_by: '张明',
      media_path: '',
      image_url: '',
    },
    claims: [],
    evidence: [],
    report: {
      id: 33,
      preliminary_conclusion:
        '初步判定为疑似AI生成。图片多模态分析显示多处AI生成痕迹，如标语与官方会务不符、持机手部缺失、光照和旗帜细节异常等。反向识图仅检索到社交媒体上的传播帖，无权威媒体或官方来源佐证。',
      summary:
        '核查图片为一张BRICS峰会领导人“自拍”合影，画面构图、标语、人物站位和细节均不符合官方会务特征。多模态分析指出标语非官方主题、持机手缺失、光照和旗帜异常，结论为疑似AI生成。',
      conclusion: '疑似AI生成',
      confidence: '高',
      evidence_table: [],
      source_links: [],
      gaps: ['缺乏官方对此次“自拍”事件的确证或辟谣信息', '图片元数据缺失'],
      pending_items: ['人工复核图中持机手势及手部细节'],
      generated_at: '2026-09-23T07:24:19.824380',
    },
    reviews: [],
  },
  'ZT-2026-0015': {
    id: 45,
    case_no: 'ZT-2026-0015',
    title: 'Canadian military silent on Chinese intercepts during latest patrol flights',
    status: 'done',
    stage: 9,
    stage_name: '已结案',
    priority: '中',
    assignee: '——',
    final_conclusion: '误导',
    screening_result: {
      passed: true,
      score: 90,
      hit_keywords: ['China', 'military'],
      reason: '内容涉及加拿大军机在中国附近海域巡逻，属于涉华军事活动。',
      focus: '涉华军事活动',
      method: 'llm',
      checked_at: '2026-09-24T02:43:15.859262',
    },
    keywords: {
      zh: '加拿大军机 中国拦截 监视飞行 东海 霓虹行动',
      en: 'Canada military aircraft China intercept surveillance flights',
    },
    search_results: [],
    trace_results: [],
    source_evals: [],
    running_log: [
      { stage: 2, name: '价值初筛', ok: true, detail: '得分90，通过' },
      { stage: 3, name: '主张拆解', ok: true, detail: '拆解 8 项主张' },
      { stage: 4, name: '多语种检索', ok: true, detail: '检索到 8 条结果' },
      { stage: 5, name: '出处追踪', ok: true, detail: '溯源 0 条' },
      { stage: 6, name: '交叉验证', ok: true, detail: '证据 9 条，独立来源 9 个' },
      { stage: 7, name: '信源评价', ok: true, detail: '评价 9 个信源' },
      { stage: 8, name: '报告生成', ok: true, detail: '结论：误导' },
    ],
    clue: {
      id: 45,
      clue_no: 'CLUE-20260924-001',
      title: 'Canadian military silent on Chinese intercepts during latest patrol flights',
      content_type: 'text',
      raw_text:
        'The Canadian military flew seven surveillance missions over waters near China in the past month to enforce North Korean sanctions, but the Department of National Defence is no longer confirming whether Chinese aircraft intercepted those flights, as it has in years past.',
      translated_text:
        '过去一个月里，加拿大军方在中国附近水域上空执行了七次监视飞行任务，但加国防部不再确认中国战机是否拦截了这些飞行。',
      source_platform: '外媒报道',
      source_account: '@DefenseNews',
      source_link: '',
      published_at: '2026-09-24',
      submitted_by: '王思思',
      media_path: '',
      image_url: '',
    },
    claims: [
      {
        id: 151,
        text: '加拿大军方不再确认中国战机是否拦截其监视飞行，与往年不同',
        type: 'allegation',
        elements: { 人物: '加拿大国防部', 地点: '中国附近水域', 定性用语: '不再确认，与往年不同' },
      },
    ],
    evidence: [
      {
        id: 293,
        name: '国防部回应澳、加军机挑衅行径：坚决反制后果自负',
        source_org: '新华社',
        source_type: '中方官方',
        publish_date: '2022-06-30',
        url: 'http://www.news.cn',
        relation: '反驳',
        reliability: '高',
        note: '中方处置措施有理有力、安全专业，加方言论歪曲事实。',
        is_independent: 1,
      },
    ],
    report: {
      id: 34,
      preliminary_conclusion:
        '外媒以“加军对中方拦截保持沉默”为标题，暗示中方行为缺乏依据；查证显示拦截程序由加方巡逻航线触发，报道省略关键背景，构成误导。',
      summary:
        '本报告核查加拿大军方对华拦截相关报道。加方以“拦截”事实为背景植入未经证实的暗示，构成误导。事实层基本准确，指控层判定为“误导”。',
      conclusion: '误导',
      confidence: '高',
      evidence_table: [],
      source_links: [],
      gaps: [],
      pending_items: [],
      generated_at: '2026-09-24T02:47:02.830528',
    },
    reviews: [
      {
        id: 16,
        reviewer: '赵强',
        action: 'approved',
        comment: '终审审核无误，结案沉淀归档。',
        check_items: ['打开原始账号核对发布日期', '确认传播语境是否暗示近期事件', '补充中文官方信源'],
        reviewed_at: '2026-09-24 15:30:00',
      },
    ],
  },
};
