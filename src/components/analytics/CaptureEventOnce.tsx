'use client';

import { useEffect } from 'react';
import { track } from '@/components/analytics/track';

type CaptureEventOnceProps = {
  /** PostHog event name, e.g. `registration_completed`. */
  event: string;
};

/**
 * Fires a PostHog event once per browser (guards against repeat/abandon visits).
 * Render it inside the page whose view marks the conversion.
 */
export const CaptureEventOnce = (props: CaptureEventOnceProps) => {
  useEffect(() => {
    const key = `ph:${props.event}`;
    if (localStorage.getItem(key)) {
      return;
    }
    localStorage.setItem(key, '1');
    track(props.event);
  }, [props.event]);

  return null;
};
