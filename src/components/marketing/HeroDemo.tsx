import { useTranslations } from 'next-intl';
import { MicIcon, SparkIcon } from '@/components/dashboard/Icons';

const bars = [
  { id: 'b1', h: 0.5 },
  { id: 'b2', h: 0.8 },
  { id: 'b3', h: 0.4 },
  { id: 'b4', h: 1 },
  { id: 'b5', h: 0.6 },
  { id: 'b6', h: 0.9 },
  { id: 'b7', h: 0.45 },
  { id: 'b8', h: 0.75 },
  { id: 'b9', h: 0.55 },
  { id: 'b10', h: 1 },
  { id: 'b11', h: 0.5 },
  { id: 'b12', h: 0.85 },
  { id: 'b13', h: 0.6 },
  { id: 'b14', h: 0.4 },
];

const soapRows = [
  { letter: 'S', widths: ['w-full', 'w-4/5'] },
  { letter: 'O', widths: ['w-full', 'w-3/5'] },
  { letter: 'A', widths: ['w-11/12'] },
  { letter: 'P', widths: ['w-full', 'w-2/3'] },
];

/** Mockup animado do fluxo áudio → SOAP, usado como âncora visual do hero. */
export const HeroDemo = () => {
  const t = useTranslations('Landing');

  return (
    <div className="relative mx-auto w-full max-w-md rounded-2xl border border-ink-200 bg-surface-elevated p-5 shadow-xl shadow-brand-900/5">
      <div className="flex items-center gap-3">
        <span className="inline-flex size-9 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <MicIcon size={18} />
        </span>
        <div className="flex-1">
          <div className="text-sm font-semibold text-ink-900">{t('hero_demo_recording')}</div>
          <div className="text-xs text-ink-500">00:42</div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-danger">
          <span className="lume-glow size-2 rounded-full bg-danger" />
          REC
        </span>
      </div>

      <div className="mt-4 flex h-12 items-end gap-1">
        {bars.map((bar, i) => (
          <span
            key={bar.id}
            className="lume-wave-bar h-full w-1.5 flex-1 rounded-full bg-brand-400"
            style={{ transform: `scaleY(${bar.h})`, animationDelay: `${i * 90}ms` }}
          />
        ))}
      </div>

      <div className="my-4 flex items-center gap-2 border-t border-ink-100 pt-4 text-xs font-medium text-brand-700">
        <SparkIcon size={14} />
        {t('hero_demo_structuring')}
      </div>

      <div className="space-y-3">
        {soapRows.map((row, rowIndex) => (
          <div key={row.letter} className="flex items-start gap-3">
            <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-brand-50 text-xs font-semibold text-brand-700">
              {row.letter}
            </span>
            <div className="flex-1 space-y-1.5 pt-1">
              {row.widths.map((width, lineIndex) => (
                <div
                  key={`${row.letter}-${width}`}
                  className={`lume-soap-line h-2 rounded ${width}`}
                  style={{ animationDelay: `${(rowIndex * 2 + lineIndex) * 160}ms` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
