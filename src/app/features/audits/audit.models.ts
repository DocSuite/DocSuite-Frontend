export interface AuditRecord {
  id: string;
  event: string;
  user_email: string;
  module: string;
  status: string;
  detail: string | null;
  resource_id: string | null;
  created_at: string;
  updated_at: string;
}
