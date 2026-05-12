export type AIKind =
  | "plan_day"
  | "motivate"
  | "summarize_tasks"
  | "analyze_habits"
  | "recommend_schedule"
  | "weekly_review"
  | "monthly_review"
  | "study_plan"
  | "spending_summary"
  | "chat";

export interface AIMemory {
  // Compact digest of the user's prior context — built from ai_summaries
  // and recent activity. Injected before the per-request user prompt.
  digest?: string;
  // Recent chat turns (most recent last) for "chat" kind continuity.
  recent?: { role: "user" | "assistant"; text: string }[];
}

export interface AIRequest {
  kind: AIKind;
  context?: Record<string, unknown>;
  message?: string;
  memory?: AIMemory;
}

export interface AIResult {
  text: string;
  data?: any;
  provider: "mock" | "anthropic";
}

export interface AIProvider {
  complete(req: AIRequest): Promise<AIResult>;
}
