'use client';

import { usePathname } from 'next/navigation';
import posthog from 'posthog-js';
import { useEffect } from 'react';
import { Env } from '@/libs/Env';

const posthogKey = Env.NEXT_PUBLIC_POSTHOG_KEY;
let initialized = false;

// Privacy-first config for a health-adjacent app: no session replay and no
// autocapture (both could leak patient data on dashboard screens). We capture
// pageviews and explicit events manually instead.
const ensureInitialized = () => {
  if (initialized || typeof window === 'undefined' || !posthogKey) {
    return;
  }
  initialized = true;
  posthog.init(posthogKey, {
    api_host: Env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: true,
    disable_session_recording: true,
  });
};

/** Initializes PostHog (deferred) and captures a pageview on every route change. */
export const PostHogInit = () => {
  const pathname = usePathname();

  useEffect(() => {
    if (!posthogKey) {
      return;
    }

    // Defer init+pageview until the browser is idle so analytics never blocks
    // the initial render — keeps PostHog off the LCP/TBT critical path.
    const run = () => {
      ensureInitialized();
      posthog.capture('$pageview');
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
