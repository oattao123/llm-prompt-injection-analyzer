export type Detection = {
  name: string;
  category: string;
  layer: "heuristic" | "encoding" | "lexical" | "llm_judge" | string;
  severity: number;
  description: string;
};

export type AnalyzeResponse = {
  is_malicious: boolean;
  risk_level: "Safe" | "Low" | "Medium" | "High" | "Critical";
  risk_score: number;
  detected_patterns: string[];
  detections: Detection[];
  llm_judge_enabled: boolean;
};

export type StatsResponse = {
  total_analyses: number;
  average_risk_score: number;
  risk_distribution: Record<string, number>;
  top_patterns: { name: string; layer: string; count: number }[];
  recent_analyses: {
    prompt_preview: string;
    risk_level: string;
    risk_score: number;
    detection_count: number;
    top_pattern: string | null;
    created_at: string;
  }[];
  hourly_attacks_24h: { hour: string; attacks: number; total: number }[];
};
