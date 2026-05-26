import { useTranslations } from 'next-intl';

type BaseTemplateProps = {
  header: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

/**
 * Minimal app shell with a sticky header and an optional footer.
 * Used by dashboard and marketing layouts.
 */
export const BaseTemplate = (props: BaseTemplateProps) => {
  const t = useTranslations('BaseTemplate');

  return (
    <div className="flex min-h-dvh flex-col">
      <header
        className="sticky top-0 z-40 border-b border-ink-200/70 bg-surface/85 backdrop-blur"
        aria-label={t('main_navigation_label')}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          {props.header}
        </div>
      </header>

      <main className="flex-1">{props.children}</main>

      {props.footer ? (
        <footer className="border-t border-ink-200/70 bg-surface">
          <div className="mx-auto max-w-6xl px-6 py-10 text-sm text-ink-500">{props.footer}</div>
        </footer>
      ) : null}
    </div>
  );
};
