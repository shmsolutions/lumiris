'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { SparkIcon, Spinner } from '@/components/dashboard/Icons';
import { ReportEditor } from '@/components/reports/ReportEditor';
import { useRouter } from '@/libs/I18nNavigation';
import type { ReportContent } from '@/validations/ReportValidation';

type ReportComposerProps = {
  patientId: string;
};

type Phase = 'setup' | 'generating' | 'review' | 'saving';

const iso = (date: Date) => date.toISOString().slice(0, 10);

const defaultPeriod = () => {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 3);
  return { start: iso(start), end: iso(end) };
};

const emptyContent: ReportContent = {
  initialComplaint: '',
  generalEvolution: '',
  objectiveProgress: [],
  difficulties: '',
  suggestions: '',
  conclusion: '',
};

const inputClass =
  'mt-1.5 w-full rounded-md border border-ink-200 bg-surface-elevated px-3 py-2 text-sm text-ink-900 transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200';
const labelClass = 'block text-xs font-semibold tracking-wide text-ink-600 uppercase';

export const ReportComposer = (props: ReportComposerProps) => {
  const t = useTranslations('ReportComposer');
  const router = useRouter();
  const initial = defaultPeriod();

  const [phase, setPhase] = useState<Phase>('setup');
  const [periodStart, setPeriodStart] = useState(initial.start);
  const [periodEnd, setPeriodEnd] = useState(initial.end);
  const [content, setContent] = useState<ReportContent>(emptyContent);
  const [meta, setMeta] = useState<{ notesCount: number; objectivesCount: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const generate = async () => {
    setErrorMessage(null);
    if (periodStart > periodEnd) {
      setErrorMessage(t('error_period'));
      return;
    }
    setPhase('generating');
    const response = await fetch(`/api/patients/${props.patientId}/reports/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ periodStart, periodEnd }),
    });
    if (!response.ok) {
      const { error } = (await response.json().catch(() => ({}))) as { error?: string };
      setErrorMessage(error === 'plan_ai_locked' ? t('error_ai_locked') : t('error_generate'));
      setPhase('setup');
      return;
    }
    const data = (await response.json()) as {
      content: ReportContent;
      meta: { notesCount: number; objectivesCount: number };
    };
    setContent(data.content);
    setMeta(data.meta);
    setPhase('review');
  };

  const save = async () => {
    setErrorMessage(null);
    setPhase('saving');
    const response = await fetch(`/api/patients/${props.patientId}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ periodStart, periodEnd, content }),
    });
    if (!response.ok) {
      setErrorMessage(t('error_save'));
      setPhase('review');
      return;
    }
    const { report } = (await response.json()) as { report: { id: string } };
    router.push(`/dashboard/patients/${props.patientId}/reports/${report.id}/`);
    router.refresh();
  };

  if (phase === 'review' || phase === 'saving') {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50/50 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-9 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
              <SparkIcon size={18} />
            </span>
            <div>
              <div className="text-sm font-semibold text-ink-900">{t('review_title')}</div>
              <div className="text-xs text-ink-600">
                {meta
                  ? t('review_meta', {
                      notes: meta.notesCount,
                      objectives: meta.objectivesCount,
                    })
                  : t('review_hint')}
              </div>
            </div>
          </div>
        </div>

        <ReportEditor value={content} onChange={setContent} disabled={phase === 'saving'} />

        {errorMessage ? <p className="text-sm text-danger">{errorMessage}</p> : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={phase === 'saving'}
            className="inline-flex items-center rounded-md bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:opacity-50"
          >
            {phase === 'saving' ? t('saving') : t('save')}
          </button>
          <button
            type="button"
            onClick={() => {
              setPhase('setup');
            }}
            className="text-sm text-ink-500 transition hover:text-ink-700"
          >
            {t('back_to_period')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-ink-200 bg-surface-elevated p-6">
        <p className="text-sm text-ink-600">{t('description')}</p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="periodStart">
              {t('period_start')}
            </label>
            <input
              id="periodStart"
              type="date"
              className={inputClass}
              value={periodStart}
              onChange={(e) => {
                setPeriodStart(e.target.value);
              }}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="periodEnd">
              {t('period_end')}
            </label>
            <input
              id="periodEnd"
              type="date"
              className={inputClass}
              value={periodEnd}
              onChange={(e) => {
                setPeriodEnd(e.target.value);
              }}
            />
          </div>
        </div>
      </section>

      {errorMessage ? <p className="text-sm text-danger">{errorMessage}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={generate}
          disabled={phase === 'generating'}
          className="inline-flex items-center gap-2 rounded-md bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:opacity-50"
        >
          {phase === 'generating' ? <Spinner size={14} /> : <SparkIcon size={14} />}
          {phase === 'generating' ? t('generating') : t('generate')}
        </button>
        <p className="text-xs text-ink-500">{t('generate_hint')}</p>
      </div>
    </div>
  );
};
