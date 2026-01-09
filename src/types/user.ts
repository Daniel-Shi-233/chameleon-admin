// User types for admin panel

export type AccountType = 'guest' | 'registered';
export type FeatureLevel = 'standard' | 'pro';
export type SubscriptionTier = 'free' | 'basic' | 'premium';
export type AcquisitionSource = 'organic' | 'paid_ad';
export type JobType = 'image' | 'video';
export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface UserListItem {
  id: string;
  account_type: AccountType;
  email: string | null;
  nickname: string | null;
  credits: number;
  credits_frozen: number;
  available_credits: number;
  feature_level: FeatureLevel;
  subscription_tier: SubscriptionTier;
  acquisition_source: AcquisitionSource;
  campaign_id: string | null;
  created_at: string;
}

export interface UserListResponse {
  users: UserListItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface JobListItem {
  id: string;
  type: JobType;
  status: JobStatus;
  cost: number;
  result_url: string | null;
  created_at: string;
}

export interface UserDetail {
  user: UserListItem;
  recent_jobs: JobListItem[];
  job_count: number;
}
