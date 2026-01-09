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
}

// Alert types
export type AlertStatus = 'pending' | 'acknowledged' | 'ticketed';

export interface JobAlertJob {
  id: string;
  user_id: string;
  type: JobType;
  status: JobStatus;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

export interface JobAlert {
  id: string;
  job_id: string;
  status: AlertStatus;
  acknowledged_at?: string;
  acknowledged_by?: string;
  admin_notes?: string;
  ticket_id?: string;
  ticket_url?: string;
  created_at: string;
  job?: JobAlertJob;
}

export interface AlertListResponse {
  alerts: JobAlert[];
  total: number;
  page: number;
  page_size: number;
}

export interface AlertStats {
  pending_alerts: number;
  acknowledged_today: number;
  ticketed_this_week: number;
}

export interface AlertListParams {
  page?: number;
  page_size?: number;
  status?: AlertStatus;
}
