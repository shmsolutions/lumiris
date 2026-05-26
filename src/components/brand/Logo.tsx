import Image from 'next/image';

type LogoProps = {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
};

const heights = { sm: 32, md: 40, lg: 64 };

/**
 * Lume logo — chama com check, acompanhada da wordmark. Usa o PNG oficial
 * (`public/assets/images/lume-logo.png`).
 */
export const Logo = (props: LogoProps) => {
  const size = heights[props.size ?? 'md'];

  return (
    <Image
      src="/assets/images/lume-logo.png"
      alt="Lume"
      width={size}
      height={size}
      className={`inline-block object-contain ${props.className ?? ''}`}
    />
  );
};
