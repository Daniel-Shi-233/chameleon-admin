export type JobType = 'image' | 'video';
export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface JobConfig {
  ratio?: string;
  resolution?: string;
  duration?: string;
  model?: string;
  style?: string;
  input_images?: string[];
  seed?: number;
}

export interface JobListItem {
  id: string;
  user_id: string;
  type: JobType;
  mode?: string;
  status: JobStatus;
  progress: number;
  cost: number;
  provider_job_id?: string;
  result_url?: string;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  // Alert fields (for failed jobs)
  alert_status?: 'pending' | 'acknowledged' | 'ticketed';
  acknowledged_at?: string;
  acknowledged_by?: string;
  admin_notes?: string;
  ticket_id?: string;
  ticket_url?: string;
}

export interface JobDetail extends JobListItem {
  prompt: string;
  negative_prompt?: string;
  config: JobConfig;
  is_safe_mode: boolean;
  result_urls?: string[];
  user?: {
    id: string;
    email?: string;
    account_type: string;
    credits: number;
  };
}

export interface JobListResponse {
  jobs: JobListItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface JobStats {
  total_jobs: number;
  queued_jobs: number;
  processing_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  today_jobs: number;
  today_failed: number;
  today_failure_rate: number;
}

export interface JobListParams {
  page?: number;
  page_size?: number;
  status?: JobStatus;
  type?: JobType;
  user_id?: string;
  alert_status?: 'pending' | 'acknowledged' | 'ticketed' | 'unhandled';
}
