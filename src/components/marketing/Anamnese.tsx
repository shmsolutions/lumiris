import { useTranslations } from 'next-intl';
import { ChartChapter } from '@/components/marketing/ChartChapter';

const findings = [
  { key: 'a', stat: '2-3h' },
  { key: 'b', stat: '10/dia' },
  { key: 'c', stat: 'Word' },
] as const;

/** § 01 — the status quo framed as a clinical intake: the therapist's complaints. */
export const Anamnese = () => {
  const t = useTranslations('Landing');

  return (
    <ChartChapter
      id="anamnese"
      num="01"
      label={t('nav_anamnese')}
      folio="02"
      title={t('problem_title')}
      marginNote={t('margin_anamnese')}
    >
      <ul className="border-t border-ink-200">
        {findings.map((finding) => (
          <li
            key={finding.key}
            className="grid gap-x-6 gap-y-2 border-b border-ink-200 py-7 sm:grid-cols-[9rem_1fr]"
          >
            <span className="font-display text-4xl leading-none text-brand-600">
              {finding.stat}
            </span>
            <div>
              <h3 className="text-base font-semibold text-ink-900">
                {t(`problem_${finding.key}_title` as 'problem_a_title')}
              </h3>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-600">
                {t(`problem_${finding.key}_body` as 'problem_a_body')}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </ChartChapter>
  );
};
