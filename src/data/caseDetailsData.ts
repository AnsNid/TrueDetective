/**
 * 案件全量详情数据类型定义。
 *
 * 数据由后端 GET /api/cases/{caseNo} 提供(见 src/api/client.ts),
 * 此文件仅保留与后端契约对应的类型声明。
 */

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
