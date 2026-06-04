'use client';

import type React from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import { CheckIcon, ChevronDownIcon } from '@/components/dashboard/Icons';

export type SelectOption = { value: string; label: string };
export type SelectGroup = { label?: string; options: SelectOption[] };

type SelectProps = {
  value: string;
  onChange: (value: string) => void;
  /** Flat list of options. Use `groups` instead for sectioned menus. */
  options?: SelectOption[];
  groups?: SelectGroup[];
  ariaLabel?: string;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
};

/**
 * Dropdown estilizado (botão + painel próprio) no lugar do `<select>` nativo,
 * que não dá pra estilizar a lista aberta. Acessível: combobox + listbox com
 * navegação por teclado e `aria-activedescendant`.
 */
export const Select = (props: SelectProps) => {
  const groups = props.groups ?? [{ options: props.options ?? [] }];
  const flat = groups.flatMap((group) => group.options);
  const selected = flat.find((option) => option.value === props.value) ?? null;

  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const baseId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }
    const onDown = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('mousedown', onDown);
    };
  }, [open]);

  const openMenu = () => {
    const index = flat.findIndex((option) => option.value === props.value);
    setHighlight(Math.max(0, index));
    setOpen(true);
  };

  const choose = (value: string) => {
    props.onChange(value);
    setOpen(false);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (!open) {
      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openMenu();
      }
      return;
    }
    if (event.key === 'Escape' || event.key === 'Tab') {
      setOpen(false);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlight((h) => Math.min(h + 1, flat.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const option = flat[highlight];
      if (option) {
        choose(option.value);
      }
    }
  };

  let optionIndex = -1;

  return (
    <div ref={wrapRef} className="relative mt-1.5">
      <button
        type="button"
        id={props.id}
        role="combobox"
        aria-controls={`${baseId}-listbox`}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={props.ariaLabel}
        aria-activedescendant={open ? `${baseId}-opt-${highlight}` : undefined}
        disabled={props.disabled}
        onClick={() => {
          if (open) {
            setOpen(false);
          } else {
            openMenu();
          }
        }}
        onKeyDown={onKeyDown}
        className="flex w-full items-center justify-between gap-2 rounded-md border border-ink-200 bg-surface-elevated px-3 py-2 text-left text-sm text-ink-900 transition hover:border-ink-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-200 focus:outline-none disabled:opacity-50"
      >
        <span className={`truncate ${selected ? '' : 'text-ink-400'}`}>
          {selected ? selected.label : (props.placeholder ?? '')}
        </span>
        <ChevronDownIcon
          size={16}
          className={`shrink-0 text-ink-400 transition ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open ? (
        <ul
          aria-label={props.ariaLabel}
          className="absolute z-20 mt-1.5 max-h-64 w-full overflow-auto rounded-lg border border-ink-200 bg-surface-elevated py-1 shadow-lg shadow-brand-900/5"
          id={`${baseId}-listbox`}
          role="listbox"
        >
          {groups.map((group, groupIdx) => (
            <li key={group.label ?? `group-${groupIdx}`}>
              {group.label ? (
                <div className="editorial-label px-3 pt-2 pb-1 text-ink-400">{group.label}</div>
              ) : null}
              <ul>
                {group.options.map((option) => {
                  optionIndex += 1;
                  const index = optionIndex;
                  const isSelected = option.value === props.value;
                  return (
                    <li
                      aria-selected={isSelected}
                      className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm transition ${
                        index === highlight ? 'bg-brand-50 text-brand-800' : 'text-ink-700'
                      }`}
                      id={`${baseId}-opt-${index}`}
                      key={option.value}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        choose(option.value);
                      }}
                      onMouseEnter={() => {
                        setHighlight(index);
                      }}
                      role="option"
                    >
                      <span className="truncate">{option.label}</span>
                      {isSelected ? (
                        <CheckIcon className="shrink-0 text-brand-600" size={15} />
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};
