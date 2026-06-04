'use client';

import { useEffect } from 'react';

type Fbq = (...args: unknown[]) => void;

type MetaPixelEventProps = {
  /** Standard or custom Meta Pixel event, e.g. `CompleteRegistration`. */
  event: string;
  /** Fire at most once per browser (guards against repeat/abandon visits). */
  once?: boolean;
};

/**
 * Fires a Meta Pixel event on mount. Render it inside the page whose view marks
 * the conversion (e.g. onboarding for a fresh sign-up). No-op without the Pixel.
 */
export const MetaPixelEvent = (props: MetaPixelEventProps) => {
  useEffect(() => {
    if (props.once) {
      const key = `mpx:${props.event}`;
      if (localStorage.getItem(key)) {
        return;
      }
      localStorage.setItem(key, '1');
    }

    const { fbq } = window as unknown as { fbq?: Fbq };
    fbq?.('track', props.event);
  }, [props.event, props.once]);

  return null;
};
