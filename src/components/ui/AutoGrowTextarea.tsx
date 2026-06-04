'use client';

import { useEffect, useRef } from 'react';

/**
 * Textarea that grows to fit its content instead of scrolling inside a fixed
 * box — long AI drafts and reports stay fully visible, which matters most on
 * mobile. Controlled usage: it resizes on mount and whenever `value` changes.
 */
export const AutoGrowTextarea = (props: React.ComponentProps<'textarea'>) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [props.value]);

  return (
    <textarea
      {...props}
      ref={ref}
      className={`${props.className ?? ''} resize-none overflow-hidden`}
    />
  );
};
