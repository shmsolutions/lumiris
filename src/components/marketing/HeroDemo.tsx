'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { CheckIcon, MicIcon, SparkIcon } from '@/components/dashboard/Icons';

// Deterministic bar heights (no Math.random) so SSR and client match.
const BAR_HEIGHTS = [
  0.5, 0.8, 0.4, 1, 0.6, 0.9, 0.45, 0.75, 0.55, 1, 0.5, 0.85, 0.6, 0.4, 0.7, 0.95, 0.5, 0.8, 0.45,
  0.65, 0.9, 0.55, 0.75, 0.6,
];

const FIELDS = ['proc', 'interc', 'evol'] as const;

// Phase 0: recording → 1: transcribing/structuring → 2: structured note. Loops.
const PHASE_DURATIONS = [2600, 2200, 3600];

const stageClass = (active: boolean) =>
  `absolute inset-0 transition-all duration-500 ${
    active ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'
  }`;

/** Looping mockup do fluxo fala → evolução estruturada — âncora visual do hero. */
export const HeroDemo = () => {
  const t = useTranslations('Landing');
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const id = setTimeout(() => {
      setPhase((p) => (p + 1) % 3);
    }, PHASE_DURATIONS[phase]);
    return () => {
      clearTimeout(id);
    };
  }, [phase]);

  let headerIcon = <MicIcon size={18} />;
  let headerTitle = t('hero_demo_recording');
  if (phase === 1) {
    headerIcon = <SparkIcon size={18} />;
    headerTitle = t('hero_demo_structuring');
  } else if (phase === 2) {
    headerIcon = <CheckIcon size={18} />;
    headerTitle = t('hero_demo_done');
  }
  const headerTone = phase === 2 ? 'bg-accent-50 text-accent-600' : 'bg-brand-50 text-brand-600';

  return (
    <div className="relative mx-auto w-full max-w-md rounded-2xl border border-ink-200 bg-surface-elevated p-5 shadow-xl shadow-brand-900/5">
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex size-9 items-center justify-center rounded-full transition-colors duration-500 ${headerTone}`}
        >
          {headerIcon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-ink-900">{headerTitle}</div>
          {phase === 0 ? <div className="font-mono text-xs text-ink-500">00:42</div> : null}
        </div>
        {phase === 0 ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-danger">
            <span className="lume-glow size-2 rounded-full bg-danger" />
            REC
          </span>
        ) : null}
        {phase === 1 ? (
          <span className="size-4 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" />
        ) : null}
      </div>

      {/* Progress rail — fills as the flow advances. */}
      <div className="mt-4 h-1 overflow-hidden rounded-full bg-ink-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-700 ease-out"
          style={{ width: `${((phase + 1) / 3) * 100}%` }}
        />
      </div>

      {/* Stage stack — fixed height so the loop never jumps. */}
      <div className="relative mt-5 h-[224px]">
        {/* Recording */}
        <div className={stageClass(phase === 0)}>
          <div className="flex h-16 items-center gap-1">
            {BAR_HEIGHTS.map((h, i) => (
              <span
                key={`bar-${i}-${h}`}
                className="lume-wave-bar h-full w-1.5 flex-1 rounded-full bg-brand-400"
                style={{ transform: `scaleY(${h})`, animationDelay: `${i * 80}ms` }}
              />
            ))}
          </div>
          <p className="mt-6 text-sm leading-relaxed text-ink-400">{t('hero_demo_transcript')}</p>
        </div>

        {/* Transcribing */}
        <div className={stageClass(phase === 1)}>
          <p className="text-sm leading-relaxed text-ink-700">
            <span className="text-ink-900">“</span>
            {t('hero_demo_transcript')}
            <span className="text-ink-900">”</span>
          </p>
          <div className="mt-5 space-y-2">
            <div className="lume-soap-line h-2.5 w-full rounded" />
            <div
              className="lume-soap-line h-2.5 w-4/5 rounded"
              style={{ animationDelay: '160ms' }}
            />
            <div
              className="lume-soap-line h-2.5 w-2/3 rounded"
              style={{ animationDelay: '320ms' }}
            />
          </div>
        </div>

        {/* Structured note */}
        <div className={stageClass(phase === 2)}>
          <div className="space-y-3">
            {FIELDS.map((key) => (
              <div key={key} className="rounded-lg border border-ink-200 bg-surface px-3 py-2.5">
                <div className="text-[10px] font-semibold tracking-wider text-brand-700 uppercase">
                  {t(`hero_demo_field_${key}` as 'hero_demo_field_proc')}
                </div>
                <div className="mt-1 text-xs leading-relaxed text-ink-700">
                  {t(`hero_demo_text_${key}` as 'hero_demo_text_proc')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
