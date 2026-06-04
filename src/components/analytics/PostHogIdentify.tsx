'use client';

import { useAuth } from '@clerk/nextjs';
import posthog from 'posthog-js';
import { useEffect } from 'react';

/**
 * Ties PostHog events to the signed-in user via the Clerk user id (no PII),
 * so the funnel from anonymous visit to paying customer can be followed.
 */
export const PostHogIdentify = () => {
  const { userId, isSignedIn } = useAuth();

  useEffect(() => {
    if (isSignedIn && userId) {
      posthog.identify(userId);
    }
  }, [isSignedIn, userId]);

  return null;
};
