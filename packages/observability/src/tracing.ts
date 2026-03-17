import { env } from '@marketbrain/config';

export function initTracing(): void {
  if (env.OTEL_ENABLED !== 'true') {
    return;
  }
}
