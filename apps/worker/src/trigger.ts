/**
 * Trigger.dev configuration — project settings for the worker.
 *
 * In Trigger.dev v3, configuration is done via trigger.config.ts at the project root
 * or via the Trigger.dev dashboard. This file exports shared constants.
 */

export const triggerConfig = {
  project: 'marketbrain',
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
    },
  },
} as const;
