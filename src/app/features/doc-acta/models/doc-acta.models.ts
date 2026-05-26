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

export interface DiarizationSegment {
  speaker: string;
  start: number;
  end: number;
}

export interface ActaDiarization {
  segments?: DiarizationSegment[];
}

export interface Acta {
  id: string;
  created_at: string;
  updated_at: string;
  filename: string;
  duration_seconds: number | null;
  transcription: string;
  diarization: ActaDiarization | null;
  result: string;
  tasks: ActaTask[];
}

export interface ActaUpdatePayload {
  transcription?: string;
  result?: string;
  tasks?: ActaTask[];
}

export interface SpeakerNamePayload {
  names: Record<string, string>;
}

export interface AudioFileInfo {
  name: string;
  sizeLabel: string;
  extension: string;
}
