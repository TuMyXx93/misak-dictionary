/**
 * Emblemas e Identidad Textil Misak (Resguardo de Guambia)
 *
 * Respeta fielmente la composición oficial de bandera-misak.png y escudo-misak.png:
 * 1.ª Franja: Magenta Misak (#E52D6D)
 * 2.ª Franja: Azul Misak (#0055AA)
 * 3.ª Franja: Blanco Puro (#FFFFFF)
 * 4.ª Franja: Negro Puro (#000000)
 */

import { BRAND_ASSETS } from '@/constants/assets';
import { cn } from '@/utils/cn';

export interface MisakBandStripeProps {
  /** 'segments' muestra los 4 bloques contiguos en una barra; 'stacked' apila las 4 franjas horizontales como la bandera */
  variant?: 'segments' | 'stacked';
  className?: string;
}

export const MisakBandStripe = ({ variant = 'segments', className }: MisakBandStripeProps) => {
  if (variant === 'stacked') {
    return (
      <div
        aria-hidden="true"
        className={cn(
          'inline-flex flex-col overflow-hidden rounded-sm border border-current/15 shrink-0',
          className,
        )}
      >
        <span className="w-full flex-1 bg-[#E52D6D]" />
        <span className="w-full flex-1 bg-[#0055AA]" />
        <span className="w-full flex-1 bg-[#FFFFFF]" />
        <span className="w-full flex-1 bg-[#000000]" />
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={cn('grid grid-cols-4 w-full h-1 overflow-hidden shrink-0', className)}
    >
      <span className="bg-[#E52D6D] h-full" />
      <span className="bg-[#0055AA] h-full" />
      <span className="bg-[#FFFFFF] h-full border-y border-black/10" />
      <span className="bg-[#000000] h-full border-y border-white/15" />
    </div>
  );
};

export interface MisakSelvedgeDividerProps {
  className?: string;
}

/**
 * Divisor inspirado en el orillo tejido inferior de la bandera Misak sobre paño negro.
 */
export const MisakSelvedgeDivider = ({ className }: MisakSelvedgeDividerProps) => (
  <div aria-hidden="true" className={cn('w-full misak-selvedge-divider rounded-full', className)} />
);

export interface MisakBrandEmblemProps {
  emblem: 'escudo' | 'bandera';
  alt: string;
  size?: number;
  className?: string;
  priority?: boolean;
}

/**
 * Renderiza el Escudo o la Bandera oficial del Pueblo Misak usando WebP con fallback PNG
 * y dimensiones intrínsecas explícitas para evitar CLS.
 */
export const MisakBrandEmblem = ({
  emblem,
  alt,
  size = 56,
  className,
  priority = false,
}: MisakBrandEmblemProps) => {
  const isEscudo = emblem === 'escudo';
  const webpSrc = isEscudo ? BRAND_ASSETS.ESCUDO_WEBP : BRAND_ASSETS.BANDERA_WEBP;
  const pngSrc = isEscudo ? BRAND_ASSETS.ESCUDO_PNG : BRAND_ASSETS.BANDERA_PNG;
  const intrinsicWidth = isEscudo ? size : Math.round(size * (1048 / 1236));
  const intrinsicHeight = size;

  return (
    <picture className="inline-flex items-center justify-center shrink-0">
      <source srcSet={webpSrc} type="image/webp" />
      <img
        src={pngSrc}
        alt={alt}
        width={intrinsicWidth}
        height={intrinsicHeight}
        loading={priority ? undefined : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        decoding="async"
        className={cn('object-contain select-none', className)}
      />
    </picture>
  );
};
