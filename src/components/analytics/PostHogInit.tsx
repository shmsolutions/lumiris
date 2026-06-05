'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Env } from '@/libs/Env';

const posthogKey = Env.NEXT_PUBLIC_POSTHOG_KEY;
let initialized = false;

// Privacy-first config for a health-adjacent app: no session replay and no
// autocapture (both could leak patient data on dashboard screens). We capture
// pageviews and explicit events manually instead.
const loadAndCapture = async () => {
  if (typeof window === 'undefined' || !posthogKey) {
    return;
  }
  // Dynamic import keeps posthog-js out of the initial bundle so it never
  // weighs on the landing's first paint / LCP — it loads after idle instead.
  const { default: posthog } = await import('posthog-js');
  if (!initialized) {
    initialized = true;
    posthog.init(posthogKey, {
      api_host: Env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
      person_profiles: 'identified_only',
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: true,
      disable_session_recording: true,
    });
  }
  posthog.capture('$pageview');
};

/** Loads PostHog (deferred) and captures a pageview on every route change. */
export const PostHogInit = () => {
  const pathname = usePathname();

  useEffect(() => {
    if (!posthogKey) {
      return;
    }

    // Defer until the browser is idle so analytics never blocks initial render.
    const run = () => {
      void loadAndCapture();
    };

    if (typeof window !== 'undefined' && window.requestIdleCallback) {
      const id = window.requestIdleCallback(run);
      return () => {
        window.cancelIdleCallback(id);
      };
    }

    const timer = setTimeout(run, 1);
    return () => {
      clearTimeout(timer);
    };
  }, [pathname]);

  return null;
};
