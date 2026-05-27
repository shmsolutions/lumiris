'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { MicIcon } from '@/components/dashboard/Icons';

type AudioRecorderProps = {
  onAudioReady: (blob: Blob, mimeType: string) => void;
  disabled?: boolean;
};

type Phase = 'idle' | 'requesting' | 'recording' | 'recorded' | 'error';

const pickMimeType = () => {
  if (typeof MediaRecorder === 'undefined') {
    return 'audio/webm';
  }
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
  return candidates.find((c) => MediaRecorder.isTypeSupported(c)) ?? 'audio/webm';
};

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export const AudioRecorder = (props: AudioRecorderProps) => {
  const t = useTranslations('AudioRecorder');
  const [phase, setPhase] = useState<Phase>('idle');
  const [seconds, setSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      }
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    },
    [],
  );

  const start = async () => {
    setErrorMessage(null);
    setPhase('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setPhase('recorded');
        props.onAudioReady(blob, mimeType);
        stream.getTracks().forEach((track) => {
          track.stop();
        });
        streamRef.current = null;
      };

      recorder.start();
      setSeconds(0);
      setPhase('recording');
      intervalRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } catch {
      setErrorMessage(t('error_mic'));
      setPhase('error');
    }
  };

  const stop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    recorderRef.current?.stop();
  };

  const reset = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSeconds(0);
    setPhase('idle');
  };

  if (phase === 'recorded' && previewUrl) {
    return (
      <div className="rounded-xl border border-ink-200 bg-surface-elevated p-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-10 items-center justify-center rounded-full bg-accent-50 text-accent-700 ring-1 ring-accent-500/20">
            <MicIcon size={18} />
          </span>
          <div className="flex-1">
            <div className="text-sm font-semibold text-ink-900">{t('recorded_title')}</div>
            <div className="text-xs text-ink-500">{formatDuration(seconds)}</div>
          </div>
          <button
            type="button"
            onClick={reset}
            className="rounded-md border border-ink-200 bg-surface-elevated px-3 py-1.5 text-xs font-medium text-ink-700 transition hover:border-ink-300"
            disabled={props.disabled}
          >
            {t('record_again')}
          </button>
        </div>
        <audio src={previewUrl} controls className="mt-4 w-full">
          <track kind="captions" />
        </audio>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-ink-200 bg-surface-elevated p-8 text-center">
      <button
        type="button"
        onClick={phase === 'recording' ? stop : start}
        disabled={props.disabled || phase === 'requesting'}
        className={`group relative inline-flex size-24 items-center justify-center rounded-full text-white shadow-lg transition disabled:opacity-50 ${
          phase === 'recording'
            ? 'animate-pulse bg-danger'
            : 'bg-brand-500 hover:scale-105 hover:bg-brand-600'
        }`}
        aria-label={phase === 'recording' ? t('stop') : t('start')}
      >
        {phase === 'recording' ? (
          <span className="block size-7 rounded-sm bg-white" />
        ) : (
          <MicIcon size={32} />
        )}
      </button>

      <div className="mt-6">
        {phase === 'idle' ? (
          <>
            <p className="text-base font-semibold text-ink-900">{t('idle_title')}</p>
            <p className="mt-1 text-sm text-ink-500">{t('idle_subtitle')}</p>
          </>
        ) : null}
        {phase === 'requesting' ? <p className="text-sm text-ink-500">{t('requesting')}</p> : null}
        {phase === 'recording' ? (
          <>
            <p className="font-mono text-3xl tracking-wider text-ink-900">
              {formatDuration(seconds)}
            </p>
            <p className="mt-1 text-sm text-ink-500">{t('recording_subtitle')}</p>
          </>
        ) : null}
        {phase === 'error' ? <p className="text-sm text-danger">{errorMessage}</p> : null}
      </div>
    </div>
  );
};
