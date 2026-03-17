/**
 * Feature flags — centralized toggle for progressive rollout.
 *
 * Phase 0: simple boolean flags. Phase 5+: remote flag service.
 */
export const featureFlags = {
  /** Enable real-time alerts via WebSocket/SSE */
  realtimeAlerts: false,
  /** Enable Web Push notifications */
  webPush: false,
  /** Enable interactive research sessions */
  interactiveResearch: false,
  /** Enable multi-model routing (vs single provider) */
  multiModelRouting: false,
} as const;

export type FeatureFlag = keyof typeof featureFlags;
