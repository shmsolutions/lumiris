'use client';

import { useState } from 'react';
import { Link } from '@/libs/I18nNavigation';
import type { PlanId } from '@/utils/Plans';

type PlanCtaProps = {
  plan: PlanId;
  isAuthenticated: boolean;
  label: string;
  className: string;
};

export const PlanCta = (props: PlanCtaProps) => {
  const [loading, setLoading] = useState(false);

  // Free plan, or a logged-out visitor: route into the signup/dashboard funnel.
  if (props.plan === 'free' || !props.isAuthenticated) {
    return (
      <Link href={props.isAuthenticated ? '/dashboard/' : '/sign-up/'} className={props.className}>
        {props.label}
      </Link>
    );
  }

  // Logged-in visitor picking a paid plan: start checkout and redirect to it.
  const startCheckout = async () => {
    setLoading(true);
    const response = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: props.plan }),
    });
    if (!response.ok) {
      setLoading(false);
      return;
    }
    const { checkoutUrl } = (await response.json()) as { checkoutUrl: string };
    window.location.href = checkoutUrl;
  };

  return (
    <button type="button" onClick={startCheckout} disabled={loading} className={props.className}>
      {loading ? '…' : props.label}
    </button>
  );
};
