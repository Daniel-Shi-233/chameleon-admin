export type TemplateType = 'image' | 'video';

export interface TemplateParams {
  ratio?: string;
  resolution?: string;
  duration?: string;
  model?: string;
  style?: string;
}

export interface Template {
  id: string;
  name: string;
  type: TemplateType;
  category: string;
  thumbnail_url: string;
  preview_video_url?: string;
  prompt: string;
  negative_prompt?: string;
  params?: TemplateParams;
  is_active: boolean;
  sort_order: number;
  is_public: boolean;
  target_campaigns?: string[];
  ab_test_group?: string;
  created_at: string;
  updated_at: string;
}

export interface TemplateListItem {
  id: string;
  name: string;
  type: TemplateType;
  category: string;
  thumbnail_url: string;
  preview_video_url?: string;
  sort_order: number;
  is_active: boolean;
  is_public: boolean;
}

export interface TemplateListResponse {
  templates: TemplateListItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface CreateTemplateRequest {
  name: string;
  type: TemplateType;
  category: string;
  thumbnail_url: string;
  preview_video_url?: string;
  prompt: string;
  negative_prompt?: string;
  params?: TemplateParams;
  is_active: boolean;
  sort_order: number;
  is_public: boolean;
  target_campaigns?: string[];
  ab_test_group?: string;
}

export interface UpdateTemplateRequest {
  name?: string;
  type?: TemplateType;
  category?: string;
  thumbnail_url?: string;
  preview_video_url?: string;
  prompt?: string;
  negative_prompt?: string;
  params?: TemplateParams;
  is_active?: boolean;
  sort_order?: number;
  is_public?: boolean;
  target_campaigns?: string[];
  ab_test_group?: string;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}
