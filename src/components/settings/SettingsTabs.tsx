'use client';

import { useState } from 'react';

export type SettingsTabId = 'perfil' | 'plano' | 'conta';

type SettingsTabsProps = {
  initialTab: SettingsTabId;
  labels: Record<SettingsTabId, string>;
  perfil: React.ReactNode;
  plano: React.ReactNode;
  conta: React.ReactNode;
};

const order: SettingsTabId[] = ['perfil', 'plano', 'conta'];

export const SettingsTabs = (props: SettingsTabsProps) => {
  const [tab, setTab] = useState<SettingsTabId>(props.initialTab);

  return (
    <div>
      <div role="tablist" className="flex gap-1 border-b border-ink-200">
        {order.map((id) => {
          const active = id === tab;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setTab(id);
              }}
              className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition ${
                active
                  ? 'border-brand-500 text-ink-900'
                  : 'border-transparent text-ink-500 hover:text-ink-800'
              }`}
            >
              {props.labels[id]}
            </button>
          );
        })}
      </div>

      <div className="mt-8">
        {tab === 'perfil' ? props.perfil : null}
        {tab === 'plano' ? props.plano : null}
        {tab === 'conta' ? props.conta : null}
      </div>
    </div>
  );
};
