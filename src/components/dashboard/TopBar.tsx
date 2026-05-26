import { UserButton } from '@clerk/nextjs';

type TopBarProps = {
  title?: React.ReactNode;
  breadcrumb?: React.ReactNode;
  actions?: React.ReactNode;
};

export const TopBar = (props: TopBarProps) => (
  <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-ink-200/70 bg-surface/90 px-4 backdrop-blur sm:px-6">
    <div className="min-w-0 flex-1">
      {props.breadcrumb ? <div className="text-xs text-ink-500">{props.breadcrumb}</div> : null}
      {props.title ? (
        <h1 className="truncate text-sm font-semibold text-ink-900 sm:text-base">{props.title}</h1>
      ) : null}
    </div>

    <div className="flex items-center gap-2">
      {props.actions}
      <UserButton
        appearance={{
          elements: {
            avatarBox: 'size-8 ring-1 ring-ink-200',
            userButtonPopoverCard: 'shadow-xl border border-ink-200',
          },
        }}
      />
    </div>
  </header>
);
