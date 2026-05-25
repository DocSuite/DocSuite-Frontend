export type ActaJobStatus = 'queued' | 'running' | 'completed' | 'failed';

export interface ActaJob {
  job_id: string;
  status: ActaJobStatus;
  progress: number;
  message: string;
  acta_id: string | null;
  error: string | null;
}

export interface ActaTask {
  description: string;
  owner?: string | null;
  due_date?: string | null;
  done: boolean;
}

export interface Acta {
  id: string;
  created_at: string;
  updated_at: string;
  filename: string;
  transcription: string;
  diarization: Record<string, unknown> | null;
  result: string;
  tasks: ActaTask[];
}

export interface AudioFileInfo {
  name: string;
  sizeLabel: string;
  extension: string;
}
