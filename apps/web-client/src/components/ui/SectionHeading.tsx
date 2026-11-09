import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { MisakBandStripe } from './MisakBandStripe';

export type SectionHeadingLevel = 'h1' | 'h2' | 'h3';
export type SectionHeadingAlign = 'center' | 'start';
export type SectionHeadingAccent = 'none' | 'band';

export interface SectionHeadingProps extends ComponentPropsWithoutRef<'h2'> {
  /**
   * Elemento semántico del encabezado.
   * @default 'h2'
   */
  as?: SectionHeadingLevel;
  /**
   * Nivel visual de escala fluida (text-fluid-h1, text-fluid-h2, text-fluid-h3).
   * Permite desacoplar la jerarquía semántica de la escala visual.
   * Por defecto adopta el mismo valor que `as`.
   */
  scale?: SectionHeadingLevel;
  /**
   * Alineación horizontal del texto.
   * @default 'center'
   */
  align?: SectionHeadingAlign;
  /**
   * Acento decorativo inferior.
   * Opción A' (Enmienda 0.2.0): 'none' por defecto, preservando la sobriedad visual
   * tras el retiro de divisores inter-sección.
   * @default 'none'
   */
  accent?: SectionHeadingAccent;
  children?: ReactNode;
}

const SCALE_CLASSES: Record<SectionHeadingLevel, string> = {
  h1: 'text-fluid-h1',
  h2: 'text-fluid-h2',
  h3: 'text-fluid-h3',
};

const ALIGN_CLASSES: Record<SectionHeadingAlign, string> = {
  center: 'text-center',
  start: 'text-start',
};

/**
 * Componente canónico para encabezados de sección en el producto público.
 *
 * Aplica por contrato:
 * - Color blanco (#FFFFFF, contraste 21:1 WCAG AAA sobre lienzo oscuro)
 * - Escala fluida responsiva (text-fluid-*)
 * - Tipografía display con tracking y text-balance
 * - font-synthesis: none y font-kerning: normal para proteger grafemas Namtrik (ɵ, Ɵ)
 * - Sin acento decorativo por defecto (Opción A' de la Enmienda 0.2.0)
 */
export function SectionHeading({
  as: Component = 'h2',
  scale,
  align = 'center',
  accent = 'none',
  className,
  style,
  children,
  id,
  ...rest
}: SectionHeadingProps) {
  const visualScale = scale ?? Component;
  const headingStyles = {
    fontSynthesis: 'none' as const,
    fontKerning: 'normal' as const,
    ...style,
  };

  const headingElement = (
    <Component
      id={id}
      className={cn(
        SCALE_CLASSES[visualScale],
        ALIGN_CLASSES[align],
        'font-display font-bold text-white tracking-tight text-balance',
        className,
      )}
      style={headingStyles}
      {...rest}
    >
      {children}
    </Component>
  );

  if (accent === 'band') {
    return (
      <div className={cn('flex flex-col', align === 'center' ? 'items-center' : 'items-start')}>
        {headingElement}
        <MisakBandStripe
          className={cn('w-16 h-1 rounded-full mt-3', align === 'center' ? 'mx-auto' : '')}
        />
      </div>
    );
  }

  return headingElement;
}
