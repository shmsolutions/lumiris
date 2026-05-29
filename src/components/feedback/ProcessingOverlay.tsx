'use client';

import { useEffect, useState } from 'react';
import { FlameIcon } from '@/components/dashboard/Icons';

type ProcessingOverlayProps = {
  title: string;
  phrases: string[];
};

/** Overlay fullscreen com frases rotativas, exibido durante processos longos (IA). */
export const ProcessingOverlay = (props: ProcessingOverlayProps) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (props.phrases.length <= 1) {
      return;
    }
    const id = setInterval(() => {
      setIndex((current) => (current + 1) % props.phrases.length);
    }, 2800);
    return () => {
      clearInterval(id);
    };
  }, [props.phrases.length]);

  const phrase = props.phrases[index] ?? '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 px-4 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <style>
        {
          '@keyframes lumirisFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}'
        }
      </style>
      <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-2xl border border-ink-200 bg-surface-elevated px-8 py-10 text-center shadow-xl">
        <span className="relative flex size-16 items-center justify-center">
          <span className="absolute inset-0 animate-spin rounded-full border-4 border-brand-100 border-t-brand-500" />
          <FlameIcon size={26} className="text-brand-500 motion-safe:animate-pulse" />
        </span>
        <div>
          <p className="text-sm font-semibold text-ink-900">{props.title}</p>
          <p
            key={index}
            style={{ animation: 'lumirisFade 0.5s ease' }}
            className="mt-1.5 min-h-10 text-sm text-ink-600"
          >
            {phrase}
          </p>
        </div>
      </div>
    </div>
  );
};
