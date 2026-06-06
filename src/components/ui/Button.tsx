type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'md' | 'sm';

// `group` lets a nested <CtaArrow/> react to hover. Color/border live per-variant,
// padding/gap per-size, so nothing collides across the merged class string.
const base =
  'group relative inline-flex items-center justify-center font-semibold transition duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 focus-visible:ring-offset-surface';

const sizes: Record<Size, string> = {
  md: 'gap-2 rounded-lg px-6 py-3 text-sm',
  sm: 'gap-1.5 rounded-md px-4 py-2 text-xs',
};

const variants: Record<Variant, string> = {
  // Flat amber per brand, lifted by a 1px top sheen and a warm ember glow that
  // only appears on hover — the heat held in check made tactile.
  primary:
    'bg-brand-500 text-ink-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] hover:-translate-y-px hover:bg-brand-600 hover:shadow-[0_14px_30px_-12px_rgba(232,146,60,0.6)] active:translate-y-0',
  secondary:
    'border border-ink-300 bg-surface-elevated text-ink-800 hover:-translate-y-px hover:border-ink-400 hover:shadow-[0_10px_24px_-14px_rgba(15,15,13,0.4)] active:translate-y-0',
  ghost:
    'gap-1.5 rounded-md border-b border-transparent pb-0.5 text-sm font-medium text-ink-700 hover:border-ink-300',
};

/** Editorial button styling — apply to a Link/a/button. Pair text with <CtaArrow/>. */
export const buttonClasses = (variant: Variant = 'primary', className = '', size: Size = 'md') => {
  const sizing = variant === 'ghost' ? '' : sizes[size];
  return `${base} ${sizing} ${variants[variant]} ${className}`.trim();
};

/** Trailing arrow that nudges right on hover; relies on the button's `group`. */
export const CtaArrow = () => (
  <span
    aria-hidden="true"
    className="transition-transform duration-200 ease-out group-hover:translate-x-0.5"
  >
    →
  </span>
);
