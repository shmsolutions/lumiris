import Image from 'next/image';

type LogoProps = {
  className?: string;
  variant?: 'full' | 'mark';
  tone?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
};

const sizes = {
  sm: { mark: 24, text: 'text-lg' },
  md: { mark: 30, text: 'text-xl' },
  lg: { mark: 40, text: 'text-2xl' },
};

/**
 * Lumiris logo — a marca (ícone "L" geométrico) acompanhada da wordmark em
 * texto. O ícone é SVG pra ficar nítido em qualquer tamanho; a wordmark é
 * texto pra consistência. `tone="light"` para fundos escuros.
 */
export const Logo = (props: LogoProps) => {
  const size = sizes[props.size ?? 'md'];
  const wordmark = props.tone === 'light' ? 'text-ink-50' : 'text-ink-800';

  return (
    <span className={`inline-flex items-center gap-2 ${props.className ?? ''}`}>
      <Image
        src="/assets/images/lumiris-mark.png"
        alt={props.variant === 'mark' ? 'Lumiris' : ''}
        width={size.mark}
        height={size.mark}
        className="object-contain"
        priority
      />
      {props.variant === 'mark' ? null : (
        <span
          className={`font-semibold tracking-tight ${size.text} ${wordmark}`}
          style={{ letterSpacing: '-0.02em' }}
        >
          lumiris
        </span>
      )}
    </span>
  );
};
