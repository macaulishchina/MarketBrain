/**
 * Feature flags — runtime toggleable via environment variables.
 *
 * Env var format: FEATURE_<FLAG_NAME_UPPER> = "true" | "false"
 * Falls back to the hard-coded default if the env var is absent.
 */

function envFlag(name: string, defaultValue: boolean): boolean {
  const raw = process.env[`FEATURE_${name.replace(/([A-Z])/g, '_$1').toUpperCase()}`];
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return defaultValue;
}

export const featureFlags = {
  /** Enable real-time alerts via WebSocket/SSE */
  get realtimeAlerts() {
    return envFlag('realtimeAlerts', true);
  },
  /** Enable Web Push notifications */
  get webPush() {
    return envFlag('webPush', true);
  },
  /** Enable interactive research sessions */
  get interactiveResearch() {
    return envFlag('interactiveResearch', true);
  },
  /** Enable multi-model routing (vs single provider) */
  get multiModelRouting() {
    return envFlag('multiModelRouting', true);
  },
  /** Beta access gate — controls who can access the app */
  get betaAccess() {
    return envFlag('betaAccess', true);
  },
};

export type FeatureFlag = keyof typeof featureFlags;
