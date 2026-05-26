type EmptyStateProps = {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
};

export const EmptyState = (props: EmptyStateProps) => (
  <div className="rounded-xl border border-dashed border-ink-300 bg-surface-elevated px-6 py-12 text-center">
    {props.icon ? (
      <div className="mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-ink-100 text-ink-500">
        {props.icon}
      </div>
    ) : null}
    <h3 className="text-base font-semibold text-ink-900">{props.title}</h3>
    {props.description ? (
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">{props.description}</p>
    ) : null}
    {props.action ? <div className="mt-5">{props.action}</div> : null}
  </div>
);
