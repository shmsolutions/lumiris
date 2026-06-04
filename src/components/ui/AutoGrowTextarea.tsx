'use client';

import { useEffect, useRef } from 'react';

const grow = (el: HTMLTextAreaElement | null) => {
  if (el) {
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }
};

/**
 * Textarea that grows to fit its content instead of scrolling inside a fixed
 * box — long AI drafts, reports and clinical notes stay fully visible, which
 * matters most on mobile. Works both controlled (value/onChange) and with
 * react-hook-form's register (it merges the forwarded ref and resizes on input).
 */
export const AutoGrowTextarea = (props: React.ComponentProps<'textarea'>) => {
  const innerRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    grow(innerRef.current);
  }, [props.value]);

  const setRef = (node: HTMLTextAreaElement | null) => {
    innerRef.current = node;
    const external = props.ref;
    if (typeof external === 'function') {
      external(node);
    } else if (external) {
      external.current = node;
    }
  };

  return (
    <textarea
      {...props}
      ref={setRef}
      onInput={(event) => {
        grow(event.currentTarget);
        props.onInput?.(event);
      }}
      className={`${props.className ?? ''} resize-none overflow-hidden`}
    />
  );
};
