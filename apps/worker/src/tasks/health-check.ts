/**
 * Health check task — verifies worker infrastructure is operational.
 */
import { task } from '@trigger.dev/sdk/v3';

export const healthCheckTask = task({
  id: 'health-check',
  run: async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      worker: 'marketbrain-worker',
    };
  },
});
