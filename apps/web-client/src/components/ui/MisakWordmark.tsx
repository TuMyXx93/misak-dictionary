import type { ComponentPropsWithoutRef, ElementType } from 'react';
import { cn } from '@/utils/cn';
import { MISAK_BRAND_NAME } from '@/utils/namtrikText';

export type MisakWordmarkVariant = 'hero' | 'login' | 'header' | 'drawer' | 'compact';

export interface MisakWordmarkProps extends ComponentPropsWithoutRef<'h1'> {
  /**
   * Escala y tipometría visual para cada contexto de la aplicación.
   * @default 'header'
   */
  variant?: MisakWordmarkVariant;
  /**
   * Elemento semántico HTML a renderizar.
   * @default según variant ('hero' y 'login' -> 'h1', otros -> 'span')
   */
  as?: ElementType;
  /**
   * Si es true, añade sombra profunda text-shadow para legibilidad sobre imágenes.
   */
  shadow?: boolean;
}

const VARIANT_STYLES: Record<MisakWordmarkVariant, string> = {
  hero: 'text-fluid-hero font-display font-bold tracking-tight text-white',
  login: 'text-2xl sm:text-3xl font-display font-bold tracking-tight text-white',
  header: 'font-display font-bold text-sm sm:text-base tracking-wide text-white',
  drawer: 'font-display font-bold text-sm text-white',
  compact: 'font-display font-bold text-sm text-white',
};

const DEFAULT_TAG: Record<MisakWordmarkVariant, ElementType> = {
  hero: 'h1',
  login: 'h1',
  header: 'span',
  drawer: 'p',
  compact: 'span',
};

/**
 * Componente Canónico de Marca Institucional Misak (Wamtɵrmarɵpik)
 * Spec 010 — Garantiza renderizado idéntico del grafema ɵ (U+0275),
 * peso font-bold (700) y kerning normal en toda la aplicación.
 */
export const MisakWordmark = ({
  variant = 'header',
  as,
  shadow = false,
  className,
  style,
  children,
  ...props
}: MisakWordmarkProps) => {
  const Component = as ?? DEFAULT_TAG[variant];
  const isHero = variant === 'hero';

  const computedStyle = {
    fontKerning: 'normal' as const,
    fontSynthesis: 'none' as const,
    ...(shadow || isHero ? { textShadow: '0 4px 18px rgba(0, 0, 0, 0.82)' } : {}),
    ...style,
  };

  return (
    <Component className={cn(VARIANT_STYLES[variant], className)} style={computedStyle} {...props}>
      {children ?? MISAK_BRAND_NAME}
    </Component>
  );
};
