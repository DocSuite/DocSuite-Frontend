export type AnalysisMode = 'general' | 'academic';

export interface DocumentAnalysis {
  id: string;
  filename: string;
  mode: AnalysisMode;
  extracted_text: string;
  result: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentAnalysisJob {
  job_id: string;
  status: string;
  progress: number;
  message: string;
  analysis_id?: string | null;
  error?: string | null;
}

export interface GeneralSection {
  title?: string | null;
  summary?: string | null;
}

export interface ImportantData {
  label?: string | null;
  value?: string | null;
  context?: string | null;
  source?: string | null;
}

export interface UsefulQuote {
  text?: string | null;
  location?: string | null;
  usefulness?: string | null;
}

export interface AnalysisResult {
  language?: string | null;
  mode?: AnalysisMode;
  source_filename?: string | null;
  document_type?: string | null;
  title?: string | null;
  executive_summary?: string | null;
  key_points?: string[];
  main_sections?: GeneralSection[];
  important_data?: ImportantData[];
  document_elements?: DocumentElementSummary[];
  conclusions?: string[] | AcademicConclusions;
  keywords?: string[];
  identification?: {
    title?: string | null;
    authors?: string[];
    year?: string | null;
    document_type?: string | null;
  };
  research?: {
    main_objective?: string | null;
    research_question?: string | null;
    problem?: string | null;
  };
  methodology?: {
    approach?: string | null;
    design?: string | null;
    techniques?: string[];
    population?: string | null;
    sample?: string | null;
    selection_criteria?: string[];
    evidence?: MethodologyEvidence[];
  };
  results?: string[];
  useful_quotes?: UsefulQuote[];
  field_contribution?: string | null;
  thesis_relevance?: {
    level?: string | null;
    reason?: string | null;
    possible_use?: string | null;
  };
}

export interface AcademicConclusions {
  general_conclusion?: string | null;
  research_answer?: string | null;
  implications?: string | null;
  limitations?: string[];
  future_recommendations?: string[];
}

export interface DocumentElementSummary {
  type?: string | null;
  source?: string | null;
  description?: string | null;
  interpreted?: boolean | null;
}

export interface MethodologyEvidence {
  field?: string | null;
  source?: string | null;
  excerpt?: string | null;
}
