'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { FileIcon, MicIcon, SparkIcon, Spinner } from '@/components/dashboard/Icons';
import { ProcessingOverlay } from '@/components/feedback/ProcessingOverlay';
import { AudioRecorder } from '@/components/notes/AudioRecorder';
import { EvolutionEditor } from '@/components/notes/EvolutionEditor';
import type { EvolutionValues } from '@/components/notes/EvolutionEditor';
import { TemplateValuesEditor } from '@/components/templates/TemplateValuesEditor';
import { useRouter } from '@/libs/I18nNavigation';
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

  const [mode, setMode] = useState<Mode>('audio');
  const [phase, setPhase] = useState<Phase>('capture');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioMime, setAudioMime] = useState<string>('');
  const [textInput, setTextInput] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [sessionDate, setSessionDate] = useState(todayIso());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [linkedObjectiveIds, setLinkedObjectiveIds] = useState<string[]>([]);
  const [aiLocked, setAiLocked] = useState(false);
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

  if (phase === 'review' && draft) {
    const isSaving = (phase as Phase) === 'saving';
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50/50 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-9 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
              <SparkIcon size={18} />
            </span>
            <div>
              <div className="text-sm font-semibold text-ink-900">
                {aiLocked
                  ? t('review_ai_locked_title')
                  : (draft.structured
                    ? t('review_structured_title')
                    : t('review_unstructured_title'))}
              </div>
              <div className="text-xs text-ink-600">
                {aiLocked
                  ? t('review_ai_locked_hint')
                  : (draft.structured
                    ? t('review_structured_hint')
                    : t('review_unstructured_hint'))}
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
              value={sessionDate}
              onChange={(event) => {
                setSessionDate(event.target.value);
              }}
              className="rounded-md border border-ink-200 bg-surface-elevated px-2 py-1 text-xs text-ink-900 focus:border-brand-400 focus:ring-2 focus:ring-brand-200 focus:outline-none"
            />
          </div>
        </div>

        {draft.transcript ? (
          <details className="rounded-xl border border-ink-200 bg-surface-elevated">
            <summary className="cursor-pointer list-none px-5 py-3 text-xs font-semibold tracking-wider text-ink-500 uppercase">
              {t('transcript_title')}
            </summary>
            <p className="border-t border-ink-200 px-5 py-4 text-sm leading-relaxed whitespace-pre-wrap text-ink-700">
              {draft.transcript}
            </p>
          </details>
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
            <h3 className="text-xs font-semibold tracking-wider text-ink-500 uppercase">
              {t('objectives_title')}
            </h3>
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
            className="inline-flex items-center gap-2 rounded-md bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:opacity-50"
          >
            {isSaving ? t('saving') : t('save')}
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(null);
              setPhase('capture');
            }}
            className="text-sm text-ink-500 transition hover:text-ink-700"
          >
            {t('discard')}
          </button>
        </div>
      </div>
    );
  }

  const guideSections = selectedTemplate
    ? selectedTemplate.definition.sections.filter((s) => s.guide?.trim())
    : [];

  return (
    <div className="space-y-6">
      {phase === 'processing' ? (
        <ProcessingOverlay
          title={t('processing_title')}
          phrases={t('processing_phrases').split('|')}
        />
      ) : null}

      {templates.length > 0 ? (
        <div>
          <label
            className="block text-xs font-semibold tracking-wide text-ink-600 uppercase"
            htmlFor="noteTemplate"
          >
            {t('template_label')}
          </label>
          <select
            id="noteTemplate"
            value={templateId}
            onChange={(e) => {
              setTemplateId(e.target.value);
            }}
            className="mt-1.5 w-full rounded-md border border-ink-200 bg-surface-elevated px-3 py-2 text-sm text-ink-900 transition focus:border-brand-400 focus:ring-2 focus:ring-brand-200 focus:outline-none"
          >
            <option value="">{t('template_default')}</option>
            {templates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {guideSections.length > 0 ? (
        <div className="rounded-xl border border-brand-200 bg-brand-50/40 p-4">
          <h3 className="text-xs font-semibold tracking-wider text-brand-800 uppercase">
            {t('guide_title')}
          </h3>
          <ul className="mt-2 space-y-1.5">
            {guideSections.map((section) => (
              <li key={section.key} className="text-xs text-ink-700">
                <span className="font-semibold text-ink-900">{section.title}:</span> {section.guide}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="inline-flex rounded-md bg-ink-100 p-1">
        <button
          type="button"
          onClick={() => {
            setMode('audio');
          }}
          className={`inline-flex items-center gap-2 rounded px-4 py-1.5 text-xs font-semibold transition ${
            mode === 'audio'
              ? 'bg-surface-elevated text-ink-900 shadow-sm'
              : 'text-ink-500 hover:text-ink-700'
          }`}
        >
          <MicIcon size={14} />
          {t('mode_audio')}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('text');
          }}
          className={`inline-flex items-center gap-2 rounded px-4 py-1.5 text-xs font-semibold transition ${
            mode === 'text'
              ? 'bg-surface-elevated text-ink-900 shadow-sm'
              : 'text-ink-500 hover:text-ink-700'
          }`}
        >
          <FileIcon size={14} />
          {t('mode_text')}
        </button>
      </div>

      {mode === 'audio' ? (
        <AudioRecorder
          onAudioReady={(blob, mime) => {
            setAudioBlob(blob);
            setAudioMime(mime);
          }}
          disabled={phase === 'processing'}
        />
      ) : (
        <div>
          <label className="block text-xs font-semibold tracking-wide text-ink-600 uppercase">
            {t('text_label')}
          </label>
          <textarea
            value={textInput}
            onChange={(event) => {
              setTextInput(event.target.value);
            }}
            rows={10}
            disabled={phase === 'processing'}
            placeholder={t('text_placeholder')}
            className="mt-1.5 w-full rounded-md border border-ink-200 bg-surface-elevated px-3 py-2 text-sm text-ink-900 transition placeholder:text-ink-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-200 focus:outline-none"
          />
        </div>
      )}

      {errorMessage ? <p className="text-sm text-danger">{errorMessage}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={startReview}
          disabled={!canProceed || phase === 'processing'}
          className="inline-flex items-center gap-2 rounded-md bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:opacity-50"
        >
          {phase === 'processing' ? <Spinner size={14} /> : <SparkIcon size={14} />}
          {phase === 'processing' ? t('processing') : t('structure')}
        </button>
        <p className="text-xs text-ink-500">{t('processing_hint')}</p>
      </div>
    </div>
  );
};
