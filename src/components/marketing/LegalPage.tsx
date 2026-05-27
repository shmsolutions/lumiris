type LegalSection = { heading: string; body: string };

type LegalPageProps = {
  title: string;
  updated: string;
  sections: LegalSection[];
};

/** Shared layout for the legal pages (privacy, terms, LGPD). */
export const LegalPage = (props: LegalPageProps) => (
  <section className="bg-surface">
    <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
      <h1 className="text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
        {props.title}
      </h1>
      <p className="mt-2 text-sm text-ink-500">{props.updated}</p>

      <div className="mt-10 space-y-8">
        {props.sections.map((section) => (
          <div key={section.heading}>
            <h2 className="text-lg font-semibold text-ink-900">{section.heading}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">{section.body}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);
