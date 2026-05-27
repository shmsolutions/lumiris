'use client';

import { useRef } from 'react';

type ConfirmDialogProps = {
  /** Question shown in the dialog body (e.g. "Excluir este anexo?"). */
  title: string;
  /** Label of the confirming (destructive) action. */
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  /** Label and styling of the trigger button that opens the dialog. */
  triggerLabel: string;
  triggerClassName?: string;
  /** When busy, the trigger is disabled and shows busyLabel. */
  busy?: boolean;
  busyLabel?: string;
  disabled?: boolean;
};

/**
 * Accessible confirmation for destructive actions, built on the native
 * `<dialog>` (focus trap, Escape to close and backdrop come for free).
 */
export const ConfirmDialog = (props: ConfirmDialogProps) => {
  const ref = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        disabled={props.disabled || props.busy}
        onClick={() => {
          ref.current?.showModal();
        }}
        className={props.triggerClassName}
      >
        {props.busy ? (props.busyLabel ?? props.triggerLabel) : props.triggerLabel}
      </button>

      <dialog
        ref={ref}
        className="m-auto w-[calc(100vw-2rem)] max-w-sm rounded-xl border border-ink-200 bg-surface-elevated p-6 text-ink-800 shadow-xl backdrop:bg-ink-900/40"
      >
        <p className="text-sm text-ink-700">{props.title}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              ref.current?.close();
            }}
            className="inline-flex min-h-11 items-center rounded-md border border-ink-200 px-4 py-2 text-sm font-medium text-ink-700 transition hover:bg-ink-100"
          >
            {props.cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              ref.current?.close();
              props.onConfirm();
            }}
            className="inline-flex min-h-11 items-center rounded-md bg-danger px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            {props.confirmLabel}
          </button>
        </div>
      </dialog>
    </>
  );
};
