'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { CloseIcon, FileIcon, MicIcon, SparkIcon, Spinner } from '@/components/dashboard/Icons';
import { ProcessingOverlay } from '@/components/feedback/ProcessingOverlay';
import { AudioRecorder } from '@/components/notes/AudioRecorder';
import { EvolutionEditor } from '@/components/notes/EvolutionEditor';
import type { EvolutionValues } from '@/components/notes/EvolutionEditor';
import { TemplateValuesEditor } from '@/components/templates/TemplateValuesEditor';
import { buttonClasses } from '@/components/ui/Button';
import { Link, useRouter } from '@/libs/I18nNavigation';
import type { TemplateValues } from '@/libs/TemplateSchema';
import type { TemplateDefinition } from '@/validations/TemplateValidation';

type LinkableObjective = {
  id: string;
  title: string;
};

type NoteTemplateOption = {
  id: string;
  name: string;
  definition: TemplateDefinition;
};

type NoteComposerProps = {
  patientId: string;
  /** Shown in the capture header chip ("Sessão com {name}"). */
  patientName?: string;
  /** Whether the user can run AI right now (paid plan or free-trial credits). */
  aiAvailable?: boolean;
  /** Free-trial generations left; null when the plan has unlimited AI. */
  trialRemaining?: number | null;
  /** Optional appointment to link this note to (passed via URL param). */
  appointmentId?: string;
  /** Active objectives from the treatment plan, shown as checklist on review. */
  objectives?: LinkableObjective[];
  templates?: NoteTemplateOption[];
};

type Mode = 'audio' | 'text';
type Phase = 'capture' | 'processing' | 'review' | 'saving';

type Draft = {
  transcript: string;
  evolution: EvolutionValues;
  structured: boolean;
};

const todayIso = () => new Date().toISOString().slice(0, 10);

const emptyEvolution: EvolutionValues = {
  procedimento: '',
  intercorrencia: '',
  evolucao: '',
};

export const NoteComposer = (props: NoteComposerProps) => {
  const t = useTranslations('NoteComposer');
  const router = useRouter();

  // No AI plan → there's nothing to capture (no transcription, no structuring).
  // Drop the recording screen entirely and open straight in the manual editor.
  const noAi = props.aiAvailable === false;

  const [mode, setMode] = useState<Mode>('audio');
  const [phase, setPhase] = useState<Phase>(noAi ? 'review' : 'capture');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioMime, setAudioMime] = useState<string>('');
  const [textInput, setTextInput] = useState('');
  const [draft, setDraft] = useState<Draft | null>(
    noAi ? { transcript: '', evolution: emptyEvolution, structured: false } : null,
  );
  const [sessionDate, setSessionDate] = useState(todayIso());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [linkedObjectiveIds, setLinkedObjectiveIds] = useState<string[]>([]);
  const [aiLocked, setAiLocked] = useState(noAi);
  const [templateId, setTemplateId] = useState('');
  const [values, setValues] = useState<TemplateValues>({});

  const templates = props.templates ?? [];
  const selectedTemplate = templates.find((tpl) => tpl.id === templateId) ?? null;

  const toggleObjective = (id: string) => {
    setLinkedObjectiveIds((prev) =>
      prev.includes(id) ? prev.filter((existing) => existing !== id) : [...prev, id],
    );
  };

  const startReview = async () => {
    setErrorMessage(null);
    setPhase('processing');

    try {
      let response: Response;
      if (mode === 'audio' && audioBlob) {
        const formData = new FormData();
        const ext = audioMime.includes('mp4') ? 'm4a' : (audioMime.includes('ogg') ? 'ogg' : 'webm');
        formData.append('audio', new File([audioBlob], `recording.${ext}`, { type: audioMime }));
        if (templateId) {
          formData.append('templateId', templateId);
        }
        response = await fetch(`/api/patients/${props.patientId}/notes/draft`, {
          method: 'POST',
          body: formData,
        });
      } else if (mode === 'text' && textInput.trim()) {
        response = await fetch(`/api/patients/${props.patientId}/notes/draft`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: textInput,
            templateId: templateId || undefined,
          }),
        });
      } else {
        setPhase('capture');
        return;
      }

      if (!response.ok) {
        const { error } = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        if (error === 'plan_ai_locked') {
          // Free plan: skip AI, let the user fill SOAP manually and save.
          setAiLocked(true);
          setDraft({
            transcript: mode === 'text' ? textInput : '',
            evolution: emptyEvolution,
            structured: false,
          });
          setPhase('review');
          return;
        }
        if (error === 'transcription_failed') {
          setErrorMessage(t('error_transcription'));
        } else {
          setErrorMessage(t('error_draft'));
        }
        setPhase('capture');
        return;
      }

      const data = (await response.json()) as {
        draft: {
          transcript: string;
          evolution?: EvolutionValues;
          values?: TemplateValues;
          structured: boolean;
        };
      };

      if (data.draft.values) {
        setValues(data.draft.values);
      }
      setDraft({
        transcript: data.draft.transcript ?? '',
        evolution: data.draft.evolution ?? emptyEvolution,
        structured: data.draft.structured,
      });
      setPhase('review');
    } catch {
      setErrorMessage(t('error_draft'));
      setPhase('capture');
    }
  };

  const save = async () => {
    if (!draft) {
      return;
    }
    setErrorMessage(null);
    setPhase('saving');

    const base = {
      sessionDate,
      appointmentId: props.appointmentId ?? null,
      transcript: draft.transcript,
      rawText: mode === 'text' ? textInput : '',
      linkedObjectives: linkedObjectiveIds,
    };
    const body = selectedTemplate
      ? { ...base, templateId, values }
      : { ...base, ...draft.evolution };
    const response = await fetch(`/api/patients/${props.patientId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      setErrorMessage(t('error_save'));
      setPhase('review');
      return;
    }

    const { note } = (await response.json()) as { note: { id: string } };
    router.push(`/dashboard/patients/${props.patientId}/notes/${note.id}/`);
    router.refresh();
  };

  const canProceed = mode === 'audio' ? audioBlob !== null : textInput.trim().length > 0;

  if ((phase === 'review' || phase === 'saving') && draft) {
    const isSaving = phase === 'saving';
    return (
      <div className="space-y-6">
        {aiLocked ? (
          <div className="relative overflow-hidden rounded-2xl border border-brand-200 bg-brand-50/60 p-5">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(90% 90% at 100% 0%, rgba(247,188,116,0.28), transparent 60%)',
              }}
            />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-sm shadow-brand-500/25">
                  <SparkIcon size={20} />
                </span>
                <div className="min-w-0">
                  <div className="text-base font-semibold text-ink-900">
                    {t('review_ai_locked_title')}
                  </div>
                  <p className="mt-0.5 text-sm text-ink-600">{t('review_ai_locked_hint')}</p>
                </div>
              </div>
              <Link
                href="/dashboard/settings/?tab=plano"
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-brand-500/25 transition hover:shadow-md hover:shadow-brand-500/30 active:scale-[0.99] sm:py-2.5"
              >
                <SparkIcon size={15} />
                {t('upgrade_cta')}
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50/50 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-9 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                <SparkIcon size={18} />
              </span>
              <div>
                <div className="text-sm font-semibold text-ink-900">
                  {draft.structured ? t('review_structured_title') : t('review_unstructured_title')}
                </div>
                <div className="text-xs text-ink-600">
                  {draft.structured ? t('review_structured_hint') : t('review_unstructured_hint')}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-ink-600" htmlFor="session-date">
                {t('field_session_date')}
              </label>
              <input
                id="session-date"
                type="date"
                aria-label={t('field_session_date')}
                value={sessionDate}
                onChange={(event) => {
                  setSessionDate(event.target.value);
                }}
                className="rounded-md border border-ink-200 bg-surface-elevated px-2 py-1 text-xs text-ink-900 focus:border-brand-400 focus:ring-2 focus:ring-brand-200 focus:outline-none"
              />
            </div>
          </div>
        )}

        {draft.transcript ? (
          <details className="rounded-xl border border-ink-200 bg-surface-elevated">
            <summary className="editorial-label cursor-pointer list-none px-5 py-3 text-ink-500">
              {t('transcript_title')}
            </summary>
            <p className="border-t border-ink-200 px-5 py-4 text-sm leading-relaxed whitespace-pre-wrap text-ink-700">
              {draft.transcript}
            </p>
          </details>
        ) : null}

        {aiLocked ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-200 pt-5">
            <span className="editorial-label text-ink-500">{t('upgrade_manual')}</span>
            <div className="flex items-center gap-2">
              <label className="text-xs text-ink-600" htmlFor="session-date">
                {t('field_session_date')}
              </label>
              <input
                id="session-date"
                type="date"
                aria-label={t('field_session_date')}
                value={sessionDate}
                onChange={(event) => {
                  setSessionDate(event.target.value);
                }}
                className="rounded-md border border-ink-200 bg-surface-elevated px-2 py-1 text-xs text-ink-900 focus:border-brand-400 focus:ring-2 focus:ring-brand-200 focus:outline-none"
              />
            </div>
          </div>
        ) : null}

        {selectedTemplate ? (
          <TemplateValuesEditor
            definition={selectedTemplate.definition}
            values={values}
            onChange={setValues}
            disabled={isSaving}
          />
        ) : (
          <EvolutionEditor
            value={draft.evolution}
            onChange={(evolution) => {
              setDraft({ ...draft, evolution });
            }}
          />
        )}

        {props.objectives && props.objectives.length > 0 ? (
          <section className="rounded-xl border border-ink-200 bg-surface-elevated p-5">
            <h3 className="editorial-label text-ink-500">{t('objectives_title')}</h3>
            <p className="mt-1 text-xs text-ink-500">{t('objectives_hint')}</p>
            <ul className="mt-4 space-y-2">
              {props.objectives.map((objective) => {
                const checked = linkedObjectiveIds.includes(objective.id);
                return (
                  <li key={objective.id}>
                    <label
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition ${
                        checked
                          ? 'border-brand-300 bg-brand-50/60'
                          : 'border-ink-200 hover:border-ink-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        aria-label={objective.title}
                        checked={checked}
                        onChange={() => {
                          toggleObjective(objective.id);
                        }}
                        className="mt-0.5 size-4 rounded border-ink-300 text-brand-500 focus:ring-brand-300"
                      />
                      <span className={checked ? 'font-medium text-ink-900' : 'text-ink-700'}>
                        {objective.title}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {errorMessage ? <p className="text-sm text-danger">{errorMessage}</p> : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={isSaving}
            className={buttonClasses('primary', '', 'sm')}
          >
            {isSaving ? t('saving') : t('save')}
          </button>
          <button
            type="button"
            onClick={() => {
              if (noAi) {
                router.push(`/dashboard/patients/${props.patientId}/notes/`);
                return;
              }
              setDraft(null);
              setPhase('capture');
            }}
            className="text-sm text-ink-500 transition hover:text-ink-700"
          >
            {noAi ? t('cancel') : t('discard')}
          </button>
        </div>
      </div>
    );
  }

  const guideSections = selectedTemplate
    ? selectedTemplate.definition.sections.filter((s) => s.guide?.trim())
    : [];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-surface">
      {phase === 'processing' ? (
        <ProcessingOverlay
          title={t('processing_title')}
          phrases={t('processing_phrases').split('|')}
        />
      ) : null}

      {/* Warm ambient wash so the focused screen still feels like Lume. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(110% 60% at 50% -5%, rgba(247,188,116,0.16), transparent 60%)',
        }}
      />

      {/* Top bar: cancel + session context. */}
      <div
        className="relative flex items-center justify-between px-4 py-3"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <button
          type="button"
          onClick={() => {
            router.push(`/dashboard/patients/${props.patientId}/notes/`);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-ink-500 transition hover:text-ink-900"
        >
          <CloseIcon size={18} />
          {t('cancel')}
        </button>
        {props.patientName ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-surface-elevated/70 px-3 py-1 text-xs text-ink-600 backdrop-blur">
            <span className="size-1.5 rounded-full bg-accent-500" />
            {t('session_with', { name: props.patientName })}
          </span>
        ) : null}
      </div>

      {/* Center stage. */}
      <div className="relative flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-4 text-center">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
            {t('capture_headline')}
          </h1>

          {typeof props.trialRemaining === 'number' ? (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
              <SparkIcon size={13} />
              {t('trial_remaining', { count: props.trialRemaining })}
            </div>
          ) : null}

          {templates.length > 0 ? (
            <select
              aria-label={t('template_label')}
              value={templateId}
              onChange={(e) => {
                setTemplateId(e.target.value);
              }}
              className="mx-auto mt-4 block w-auto max-w-full rounded-full border border-ink-200 bg-surface-elevated px-4 py-1.5 text-xs font-medium text-ink-700 transition focus:border-brand-400 focus:ring-2 focus:ring-brand-200 focus:outline-none"
            >
              <option value="">{t('template_default')}</option>
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name}
                </option>
              ))}
            </select>
          ) : null}

          {guideSections.length > 0 ? (
            <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50/40 p-4 text-left">
              <h3 className="editorial-label text-brand-800">{t('guide_title')}</h3>
              <ul className="mt-2 space-y-1.5">
                {guideSections.map((section) => (
                  <li key={section.key} className="text-xs text-ink-700">
                    <span className="font-semibold text-ink-900">{section.title}:</span>{' '}
                    {section.guide}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-8">
            {mode === 'audio' ? (
              <AudioRecorder
                bare
                onAudioReady={(blob, mime) => {
                  setAudioBlob(blob);
                  setAudioMime(mime);
                }}
                disabled={phase === 'processing'}
              />
            ) : (
              <textarea
                aria-label={t('capture_headline')}
                value={textInput}
                onChange={(event) => {
                  setTextInput(event.target.value);
                }}
                rows={8}
                disabled={phase === 'processing'}
                placeholder={t('text_placeholder')}
                className="w-full rounded-xl border border-ink-200 bg-surface-elevated px-4 py-3 text-left text-sm text-ink-900 transition placeholder:text-ink-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-200 focus:outline-none"
              />
            )}
          </div>

          {errorMessage ? <p className="mt-4 text-sm text-danger">{errorMessage}</p> : null}
        </div>
      </div>

      {/* Bottom actions. */}
      <div
        className="relative space-y-3 px-6 pt-3"
        style={{ paddingBottom: 'max(1.75rem, env(safe-area-inset-bottom))' }}
      >
        <button
          type="button"
          onClick={() => {
            setMode(mode === 'audio' ? 'text' : 'audio');
          }}
          disabled={phase === 'processing'}
          className="mx-auto flex items-center gap-1.5 text-sm font-medium text-brand-700 transition hover:text-brand-800 disabled:opacity-50"
        >
          {mode === 'audio' ? <FileIcon size={15} /> : <MicIcon size={15} />}
          {mode === 'audio' ? t('switch_text') : t('switch_audio')}
        </button>
        <button
          type="button"
          onClick={startReview}
          disabled={!canProceed || phase === 'processing'}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm shadow-brand-500/25 transition hover:shadow-md hover:shadow-brand-500/30 active:scale-[0.99] disabled:opacity-50 disabled:shadow-none"
        >
          {phase === 'processing' ? <Spinner size={15} /> : <SparkIcon size={15} />}
          {phase === 'processing' ? t('processing') : t('structure')}
        </button>
      </div>
    </div>
  );
};
