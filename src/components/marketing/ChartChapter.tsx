import { useTranslations } from 'next-intl';

type ChartChapterProps = {
  /** Anchor id, also the scroll-spy target (e.g. "anamnese"). */
  id: string;
  /** Two-digit section number, e.g. "01". */
  num: string;
  /** Clinical chapter label, e.g. "Anamnese". */
  label: string;
  /** Folio (page) number printed in the margin, e.g. "02". */
  folio: string;
  title: React.ReactNode;
  /** Optional clinician's note pinned in the left margin (spine layout only). */
  marginNote?: string;
  /** Optional lead paragraph under the title. */
  subtitle?: string;
  tone?: 'surface' | 'alt';
  /** "spine" puts meta in a left margin; "banner" runs full-width (wide content). */
  layout?: 'spine' | 'banner';
  children: React.ReactNode;
};

/**
 * One chapter of the landing-as-chart. A left "spine" carries the section
 * number, clinical label, folio and marginalia — like the margin of a real
 * occupational-therapy record — while the content sits in the wider column.
 */
export const ChartChapter = (props: ChartChapterProps) => {
  const t = useTranslations('Landing');
  const bg = props.tone === 'alt' ? 'bg-ink-50' : 'bg-surface';

  const meta = (
    <div className="flex items-center gap-2.5">
      <span className="font-display text-xl leading-none text-brand-700">§</span>
      <span className="font-mono text-xs text-ink-500 tabular-nums">{props.num}</span>
      <span className="editorial-label text-ink-700">{props.label}</span>
    </div>
  );
  const folio = (
    <span className="font-mono text-[11px] text-ink-500 tabular-nums">
      {t('chart_folio')} {props.folio}
    </span>
  );

  if (props.layout === 'banner') {
    return (
      <section id={props.id} className={`scroll-mt-28 border-b border-ink-200/60 ${bg}`}>
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <div className="flex items-center justify-between border-b border-ink-200 pb-4">
            {meta}
            {folio}
          </div>
          <h2 className="font-display mt-8 max-w-2xl text-4xl leading-[1.08] text-balance text-ink-900 sm:text-5xl">
            {props.title}
          </h2>
          {props.subtitle ? (
            <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-600">{props.subtitle}</p>
          ) : null}
          <div className="mt-12">{props.children}</div>
        </div>
      </section>
    );
  }

  return (
    <section id={props.id} className={`scroll-mt-28 border-b border-ink-200/60 ${bg}`}>
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <div className="grid gap-x-12 gap-y-8 lg:grid-cols-12">
          <aside className="lg:col-span-3">
            {meta}
            <div className="mt-3">{folio}</div>

            {props.marginNote ? (
              <p className="marginalia mt-6 border-l border-ink-300 pl-3 lg:max-w-[12rem]">
                {props.marginNote}
              </p>
            ) : null}
          </aside>

          <div className="lg:col-span-9">
            <h2 className="font-display max-w-2xl text-4xl leading-[1.08] text-balance text-ink-900 sm:text-5xl">
              {props.title}
            </h2>
            <div className="mt-12">{props.children}</div>
          </div>
        </div>
      </div>
    </section>
  );
};
