'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { CheckIcon, MicIcon } from '@/components/dashboard/Icons';

type AudioRecorderProps = {
  onAudioReady: (blob: Blob, mimeType: string) => void;
  disabled?: boolean;
  /** Drops the card chrome so the recorder blends into a full-screen surface. */
  bare?: boolean;
};

type Phase = 'idle' | 'requesting' | 'recording' | 'recorded' | 'error';

const BAR_COUNT = 40;

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

  // Live waveform — drawn straight to canvas via rAF so 60fps updates never
  // round-trip through React state.
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const rafRef = useRef<number | null>(null);

  const teardownAudio = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    analyserRef.current = null;
    dataRef.current = null;
    if (audioCtxRef.current) {
      void audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  };

  useEffect(
    () => () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      teardownAudio();
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

  const drawWave = () => {
    rafRef.current = requestAnimationFrame(drawWave);
    const analyser = analyserRef.current;
    const canvas = canvasRef.current;
    const data = dataRef.current;
    if (!(analyser && canvas && data)) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const cssWidth = canvas.clientWidth;
    const cssHeight = canvas.clientHeight;
    if (canvas.width !== cssWidth * dpr || canvas.height !== cssHeight * dpr) {
      canvas.width = cssWidth * dpr;
      canvas.height = cssHeight * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    analyser.getByteFrequencyData(data);
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    const gap = 4;
    const barWidth = (cssWidth - gap * (BAR_COUNT - 1)) / BAR_COUNT;
    const step = Math.floor(data.length / BAR_COUNT) || 1;
    const gradient = ctx.createLinearGradient(0, 0, 0, cssHeight);
    gradient.addColorStop(0, '#f7bc74');
    gradient.addColorStop(1, '#e8923c');
    ctx.fillStyle = gradient;

    for (let i = 0; i < BAR_COUNT; i += 1) {
      let sum = 0;
      for (let j = 0; j < step; j += 1) {
        sum += data[i * step + j] ?? 0;
      }
      const value = sum / step / 255;
      const barHeight = Math.max(cssHeight * 0.12, value * cssHeight * 1.4);
      const x = i * (barWidth + gap);
      const y = (cssHeight - barHeight) / 2;
      const radius = barWidth / 2;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, Math.min(barHeight, cssHeight), radius);
      ctx.fill();
    }
  };

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
        teardownAudio();
        stream.getTracks().forEach((track) => {
          track.stop();
        });
        streamRef.current = null;
      };

      // Wire up the live analyser for the waveform.
      const AudioCtx =
        window.AudioContext ??
        (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.7;
        source.connect(analyser);
        audioCtxRef.current = audioCtx;
        analyserRef.current = analyser;
        dataRef.current = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
        rafRef.current = requestAnimationFrame(drawWave);
      }

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
      <div className="relative overflow-hidden rounded-2xl border border-accent-500/30 bg-surface-elevated p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 -right-10 size-40 rounded-full bg-accent-500/10 blur-3xl"
        />
        <div className="relative flex items-center gap-3">
          <span className="inline-flex size-11 items-center justify-center rounded-full bg-accent-50 text-accent-600 ring-1 ring-accent-500/20">
            <CheckIcon size={20} />
          </span>
          <div className="flex-1">
            <div className="text-sm font-semibold text-ink-900">{t('recorded_title')}</div>
            <div className="font-mono text-xs text-ink-500">{formatDuration(seconds)}</div>
          </div>
          <button
            type="button"
            onClick={reset}
            className="rounded-lg border border-ink-200 bg-surface-elevated px-3 py-1.5 text-xs font-semibold text-ink-700 transition hover:border-ink-300 hover:bg-ink-50"
            disabled={props.disabled}
          >
            {t('record_again')}
          </button>
        </div>
        <audio src={previewUrl} controls className="relative mt-4 w-full">
          <track kind="captions" />
        </audio>
      </div>
    );
  }

  const recording = phase === 'recording';

  return (
    <div
      className={
        props.bare
          ? 'relative w-full'
          : 'relative overflow-hidden rounded-2xl border border-ink-200 bg-surface-elevated'
      }
    >
      {/* Warm ambient mesh — the "lume" glow that makes the surface feel alive. */}
      {props.bare ? null : (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 80% at 50% -10%, rgba(247,188,116,0.18), transparent 60%), radial-gradient(80% 60% at 80% 110%, rgba(13,148,136,0.07), transparent 70%)',
          }}
        />
      )}

      <div
        className={`relative flex flex-col items-center text-center ${props.bare ? 'py-2' : 'px-6 py-12'}`}
      >
        <div className="relative flex items-center justify-center">
          {/* Pulsing halo rings — gentle when idle, energetic while recording. */}
          {recording ? (
            <>
              <span className="lume-ripple pointer-events-none absolute inline-flex size-24 rounded-full bg-brand-400/30" />
              <span
                className="lume-ripple pointer-events-none absolute inline-flex size-24 rounded-full bg-brand-400/20"
                style={{ animationDelay: '0.9s' }}
              />
            </>
          ) : (
            <span className="lume-breathe pointer-events-none absolute inline-flex size-28 rounded-full bg-brand-300/25 blur-xl" />
          )}

          <button
            type="button"
            onClick={recording ? stop : start}
            disabled={props.disabled || phase === 'requesting'}
            className={`relative inline-flex size-24 items-center justify-center rounded-full text-white shadow-lg shadow-brand-500/25 transition active:scale-95 disabled:opacity-50 ${
              recording
                ? 'bg-brand-600'
                : 'bg-gradient-to-br from-brand-400 to-brand-600 hover:scale-105 hover:shadow-brand-500/40'
            }`}
            aria-label={recording ? t('stop') : t('start')}
          >
            {recording ? (
              <span className="block size-7 rounded-md bg-white" />
            ) : (
              <MicIcon size={34} />
            )}
          </button>
        </div>

        <div className="mt-8 w-full">
          {phase === 'idle' ? (
            <>
              <p className="text-base font-semibold text-ink-900">{t('idle_title')}</p>
              <p className="mx-auto mt-1.5 max-w-xs text-sm text-ink-500">{t('idle_subtitle')}</p>
            </>
          ) : null}

          {phase === 'requesting' ? (
            <p className="text-sm text-ink-500">{t('requesting')}</p>
          ) : null}

          {recording ? (
            <>
              <div className="mb-4 flex items-center justify-center gap-2">
                <span className="size-2 animate-pulse rounded-full bg-danger" />
                <span className="font-mono text-3xl font-medium tracking-wider text-ink-900 tabular-nums">
                  {formatDuration(seconds)}
                </span>
              </div>
              <canvas ref={canvasRef} className="mx-auto h-16 w-full max-w-sm" aria-hidden="true" />
              <p className="mt-3 text-sm text-ink-500">{t('recording_subtitle')}</p>
            </>
          ) : null}

          {phase === 'error' ? <p className="text-sm text-danger">{errorMessage}</p> : null}
        </div>
      </div>
    </div>
  );
};
