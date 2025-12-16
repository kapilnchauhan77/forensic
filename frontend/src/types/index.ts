export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  role: 'admin' | 'examiner' | 'technician' | 'readonly';
  agency: string | null;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

export interface Case {
  id: string;
  case_number: string;
  title: string;
  description: string | null;
  agency: string | null;
  source_type: string;
  status: 'open' | 'in_progress' | 'review' | 'closed' | 'archived';
  operator_id: string;
  operator_name: string | null;
  external_reference: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  exhibit_count: number;
  fingerprint_count: number;
}

export interface Exhibit {
  id: string;
  exhibit_number: string;
  description: string | null;
  location_collected: string | null;
  collection_date: string | null;
  collector_name: string | null;
  case_id: string;
  sequence_order: number;
  created_at: string;
  updated_at: string;
  fingerprint_count: number;
}

export interface QualityIssue {
  code: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface SingularPointPosition {
  x: number;
  y: number;
  type?: string;
}

export interface MinutiaeBreakdown {
  ridge_endings: number;
  bifurcations: number;
  short_ridges: number;
  dots: number;
  islands: number;
  other: number;
}

export type EnhancementMethod = 'auto' | 'gemini' | 'opencv';

export interface ProcessingResult {
  id: string;
  enhanced_storage_path: string;
  enhanced_url: string | null;
  pipeline_version: string;
  enhancement_preset: string;
  enhancement_method?: EnhancementMethod;
  quality_score_before: number | null;
  quality_score_after: number | null;
  quality_improvement: number | null;
  processing_time_ms: number | null;
  artifact_risk_level: string | null;
  artifact_warnings: string[] | null;
  is_primary: boolean;
  created_at: string;
}

export interface ProcessOptions {
  enhancement_preset?: string;
  enhancement_method?: EnhancementMethod;
  generate_variants?: boolean;
  force?: boolean;
}

export type EvidenceType = 'latent' | 'patent' | 'plastic' | 'unknown';
export type DetailLevel = 'level_1' | 'level_2' | 'level_3';

export interface Fingerprint {
  id: string;
  original_filename: string;
  original_hash_sha256: string;
  original_url: string | null;
  file_size_bytes: number;
  mime_type: string;
  image_width: number | null;
  image_height: number | null;
  dpi: number | null;
  evidence_type: EvidenceType;
  print_type: string;
  finger_position: string;
  subject_id: string | null;
  status: 'pending' | 'queued' | 'processing' | 'completed' | 'failed';
  processing_error: string | null;
  quality_score: number | null;
  quality_issues: QualityIssue[] | null;

  // Classification results
  detail_level: DetailLevel | null;
  pattern_type: string | null;
  pattern_subtype: string | null;
  pattern_confidence: number | null;
  classification_rationale: string | null;

  // FBI/NCIC Classification
  ncic_code: string | null;
  henry_value: number | null;
  ridge_count: number | null;
  core_count: number | null;
  delta_count: number | null;

  // Singular point positions
  core_positions: SingularPointPosition[] | null;
  delta_positions: SingularPointPosition[] | null;

  // Minutiae summary
  minutiae_count: number | null;
  minutiae_details: MinutiaeBreakdown | null;

  // Ridge characteristics
  ridge_flow_direction: string | null;
  ridge_density: number | null;

  // Examiner fields
  examiner_notes: string | null;
  manual_override: boolean;

  exhibit_id: string;
  uploaded_by_id: string;
  created_at: string;
  updated_at: string;
  processed_at: string | null;
  processing_results: ProcessingResult[];
  ridge_orientation_map_url?: string | null;
  rationale_overlay_url?: string | null;
}

export interface PipelineConfig {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  config: Record<string, unknown>;
  artifact_risk_level: string;
  is_default: boolean;
  is_active: boolean;
  version: string;
  created_at: string;
  updated_at: string;
}

export interface PipelineVersion {
  id: string;
  version: string;
  description: string | null;
  steps: string[];
  gemini_model: string | null;
  is_current: boolean;
  created_at: string;
}

export interface CaseListResponse {
  cases: Case[];
  total: number;
  page: number;
  page_size: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}
