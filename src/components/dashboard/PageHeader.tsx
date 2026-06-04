type PageHeaderProps = {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
};

export const PageHeader = (props: PageHeaderProps) => (
  <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink-200/70 pb-6">
    <div className="min-w-0">
      {props.eyebrow ? <p className="editorial-label text-ink-500">{props.eyebrow}</p> : null}
      <h1 className="font-display mt-2 text-3xl leading-[1.1] text-ink-900 sm:text-4xl">
        {props.title}
      </h1>
      {props.description ? (
        <p className="mt-3 max-w-2xl text-sm text-ink-600">{props.description}</p>
      ) : null}
    </div>

    {props.actions ? <div className="flex items-center gap-2">{props.actions}</div> : null}
  </div>
);
