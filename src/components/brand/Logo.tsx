type LogoProps = {
  className?: string;
  variant?: 'full' | 'mark';
  tone?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
};

const sizes = {
  sm: { mark: 20, text: 'text-base' },
  md: { mark: 28, text: 'text-xl' },
  lg: { mark: 36, text: 'text-2xl' },
};

/**
 * Lume logo — flame inside a soft circle, paired with the wordmark.
 * The mark stays in brand-500; wordmark adapts to background tone.
 */
export const Logo = (props: LogoProps) => {
  const size = sizes[props.size ?? 'md'];
  const wordmark = props.tone === 'dark' ? 'text-ink-50' : 'text-ink-800';

  return (
    <span className={`inline-flex items-center gap-2 ${props.className ?? ''}`}>
      <Mark size={size.mark} />
      {props.variant === 'mark' ? null : (
        <span
          className={`font-semibold tracking-tight ${size.text} ${wordmark}`}
          style={{ letterSpacing: '-0.02em' }}
        >
          lume
        </span>
      )}
    </span>
  );
};

const Mark = (props: { size: number }) => (
  <svg
    width={props.size}
    height={props.size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <circle cx="20" cy="20" r="19" stroke="var(--color-brand-500)" strokeWidth="2" />
    <path
      d="M20 9c2.4 3.4 5.4 6.2 5.4 10.6a5.4 5.4 0 0 1-10.8 0c0-1.8.7-3 1.6-4.2.4 1 1.2 1.6 2 1.6.6 0 1-.4 1-1 0-1-.4-2-.4-3.2 0-1.6.8-2.8 1.2-3.8Z"
      fill="var(--color-brand-500)"
    />
    <circle cx="20" cy="22" r="2.2" fill="var(--color-brand-100)" />
  </svg>
);
