/**
 * Application configuration constants.
 *
 * This file centralizes all URLs and external service configurations.
 * Update these values when migrating to custom domains.
 */
export const config = {
  // ============================================================
  // External URLs
  // ============================================================

  /**
   * Admin Panel URL (self)
   * Current: Cloudflare Pages (testing)
   * Target:  https://admin.mirag3.com (production)
   */
  adminPanelUrl: 'https://chameleon-admin.pages.dev',

  /**
   * Attribution Landing Page URL
   * Current: Cloudflare Pages (testing)
   * Target:  https://mirag3.com (production)
   */
  landingPageUrl: 'https://landing-4po.pages.dev',

  /**
   * Backend API Base URL
   * Production: Cloud Run
   */
  apiBaseUrl: 'https://chameleon-api-446996287300.us-central1.run.app',

  // ============================================================
  // App Store Links
  // ============================================================

  /**
   * iOS App Store URL
   * TODO: Update with actual App Store ID after submission
   */
  appStoreUrl: 'https://apps.apple.com/app/mirage/id0000000000',

  /**
   * Android Play Store URL
   * TODO: Update with actual package name after submission
   */
  playStoreUrl: 'https://play.google.com/store/apps/details?id=com.chameleon.chameleon_app',

  // ============================================================
  // CDN & Assets
  // ============================================================

  /**
   * CDN Base URL for user-generated content
   */
  cdnBaseUrl: 'https://assets.mirag3.com',

  // ============================================================
  // Contact & Support
  // ============================================================

  /**
   * Support Email
   */
  supportEmail: 'support@mirag3.com',

  /**
   * System Email (no-reply)
   */
  systemEmail: 'noreply@mirag3.com',

  // ============================================================
  // Helper Functions
  // ============================================================

  /**
   * Generate a test attribution link
   * @param campaignId Campaign ID for testing
   * @param platform Platform (android/ios)
   */
  generateTestAttributionLink: (campaignId: string, platform: 'android' | 'ios' = 'android') => {
    const params = new URLSearchParams({
      campaign_id: campaignId,
      campaign_name: `${platform}_test`,
      source: 'manual_test',
      utm_source: `${platform}_device`,
      platform,
    });
    return `${config.landingPageUrl}/?${params.toString()}`;
  },

  /**
   * Generate a user attribution link
   * @param userId User ID
   * @param campaignId Optional campaign ID
   */
  generateUserAttributionLink: (userId: string, campaignId?: string) => {
    const params = new URLSearchParams({
      ref: userId,
      ...(campaignId && { campaign_id: campaignId }),
    });
    return `${config.landingPageUrl}/?${params.toString()}`;
  },

  /**
   * Check if using production domains
   */
  get isProduction() {
    return config.landingPageUrl.includes('mirag3.com');
  },

  /**
   * Get current environment name
   */
  get environment() {
    return config.isProduction ? 'production' : 'development';
  },
} as const;

/**
 * Type-safe config keys
 */
export type ConfigKey = keyof typeof config;

/**
 * Environment-specific overrides (if needed)
 */
export const getConfig = (_env?: string) => {
  // Future: Add environment-specific overrides here
  // For now, always return the base config
  return config;
};
