// Attribution statistics types for admin panel

export interface AttributionStats {
  // Raw counts from backend
  total_users: number;
  organic_users: number;
  paid_ad_users: number;
  total_fingerprints: number;
  matched_fingerprints: number;
  trial_credits_granted: number;
  organic_total_credits: number;
  paid_ad_total_credits: number;

  // Calculated percentages from backend
  organic_percentage: number;
  paid_ad_percentage: number;
  match_rate: number;
  credit_grant_rate: number;
}

// Funnel statistics types
export interface FunnelStats {
  page_views: number;
  download_clicks: number;
  app_opens: number;
  attributions: number;
}

export interface ConversionRates {
  click_rate: number;
  install_rate: number;
  attribution_rate: number;
}

export interface CampaignFunnelStats {
  campaign_id: string;
  page_views: number;
  download_clicks: number;
  app_opens: number;
  attributions: number;
  click_rate: number;
  install_rate: number;
  attribution_rate: number;
}

export interface SourceFunnelStats {
  source: string;
  page_views: number;
  download_clicks: number;
  app_opens: number;
  attributions: number;
  click_rate: number;
  install_rate: number;
  attribution_rate: number;
}

export interface FunnelStatsResponse {
  period: string;
  funnel: FunnelStats;
  conversion_rates: ConversionRates;
  by_campaign: CampaignFunnelStats[];
  by_source: SourceFunnelStats[];
}

// Matching rule configuration types
export interface MatchingRuleConfig {
  id: string;
  threshold: number;
  device_model_score: number;
  screen_score: number;
  timezone_score: number;
  language_score: number;
  country_score: number;
  screen_tolerance: number;
  is_active: boolean;
  description?: string;
  created_at: string;
  created_by?: string;
}

export interface CreateMatchingRuleRequest {
  threshold: number;
  device_model_score: number;
  screen_score: number;
  timezone_score: number;
  language_score: number;
  country_score: number;
  screen_tolerance: number;
  description?: string;
}

export interface TestMatchingRuleRequest {
  rule: CreateMatchingRuleRequest;
  data: {
    device_model?: string;
    screen_width?: number;
    screen_height?: number;
    timezone?: string;
    language?: string;
    country?: string;
  };
}

export interface TestMatchingRuleResponse {
  score: number;
  passed: boolean;
  breakdown: {
    device_model: number;
    screen: number;
    timezone: number;
    language: number;
    country: number;
  };
}
