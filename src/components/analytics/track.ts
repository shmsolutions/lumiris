import posthog from 'posthog-js';

/**
 * Fires a PostHog product event for activation/retention funnels. No-op when
 * PostHog isn't configured (the singleton just queues and never flushes).
 */
export const track = (event: string, props?: Record<string, unknown>) => {
  posthog.capture(event, props);
};
