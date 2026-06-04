'use client';

import { usePathname } from 'next/navigation';
import posthog from 'posthog-js';
import { useEffect } from 'react';
import { Env } from '@/libs/Env';

const posthogKey = Env.NEXT_PUBLIC_POSTHOG_KEY;

// Privacy-first config for a health-adjacent app: no session replay and no
// autocapture (both could leak patient data on dashboard screens). We capture
// pageviews and explicit events manually instead.
if (typeof window !== 'undefined' && posthogKey) {
  posthog.init(posthogKey, {
    api_host: Env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: true,
    disable_session_recording: true,
  });
}

/** Initializes PostHog and captures a pageview on every route change. */
export const PostHogInit = () => {
  const pathname = usePathname();

  useEffect(() => {
    if (posthogKey) {
      posthog.capture('$pageview');
    }
  }, [pathname]);

  return null;
};
