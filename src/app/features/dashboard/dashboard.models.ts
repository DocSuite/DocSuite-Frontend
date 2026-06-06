export interface DashboardMetric {
  key: string;
  label: string;
  value: number;
  detail: string;
}

export interface DashboardTrendPoint {
  label: string;
  analyses: number;
  actas: number;
}

export interface DashboardDistributionItem {
  label: string;
  value: number;
}

export interface DashboardTaskStatus {
  pending: number;
  completed: number;
}

export interface DashboardActivityItem {
  title: string;
  type: string;
  reference: string;
  created_at: string;
}

export interface DashboardAuditItem {
  title: string;
  detail: string;
  status: string;
  created_at: string;
}

export interface DashboardSummary {
  metrics: DashboardMetric[];
  trend: DashboardTrendPoint[];
  distribution: DashboardDistributionItem[];
  tasks: DashboardTaskStatus;
  activity: DashboardActivityItem[];
  audits: DashboardAuditItem[];
}
