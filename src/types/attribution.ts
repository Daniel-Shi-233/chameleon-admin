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
