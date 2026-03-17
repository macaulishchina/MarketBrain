/**
 * Deliver Alerts Task — finds all pending alerts for a given event,
 * generates alert cards for each, and marks them as delivered.
 *
 * This is the top-level orchestration task for alert delivery.
 * It calls classify-event first, then generate-alert for each created alert.
 */
import { task } from '@trigger.dev/sdk/v3';
import { prisma } from '@marketbrain/db';
import { type ProviderId } from '@marketbrain/ai';
import { classifyEventTask } from './classify-event';
import { generateAlertTask } from './generate-alert';

export interface DeliverAlertsPayload {
  eventId: string;
  provider?: ProviderId;
}

export interface DeliverAlertsResult {
  eventId: string;
  classified: number;
  generated: number;
  failed: number;
}

export const deliverAlertsTask = task({
  id: 'deliver-alerts',
  retry: { maxAttempts: 1 },
  run: async (payload: DeliverAlertsPayload): Promise<DeliverAlertsResult> => {
    const { eventId, provider } = payload;

    // 1. Classify the event and create pending alerts for qualifying users
    const classifyResult = await classifyEventTask.triggerAndWait({ eventId });

    if (!classifyResult.ok) {
      return { eventId, classified: 0, generated: 0, failed: 1 };
    }

    const classified = classifyResult.output.alertsCreated;

    if (classified === 0) {
      return { eventId, classified: 0, generated: 0, failed: 0 };
    }

    // 2. Fetch all pending alerts for this event
    const pendingAlerts = await prisma.alert.findMany({
      where: { eventId, status: 'pending' },
    });

    // 3. Generate alert cards for each pending alert
    let generated = 0;
    let failed = 0;

    for (const alert of pendingAlerts) {
      // Check if user has muted this alert
      if (alert.muted) {
        await prisma.alert.update({
          where: { id: alert.id },
          data: { status: 'dismissed' },
        });
        continue;
      }

      const genResult = await generateAlertTask.triggerAndWait({
        alertId: alert.id,
        provider,
      });

      if (genResult.ok && genResult.output.passed) {
        generated++;
      } else {
        failed++;
      }
    }

    return { eventId, classified, generated, failed };
  },
});
