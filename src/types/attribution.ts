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
