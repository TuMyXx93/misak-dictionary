import { type FC } from 'react';
import { cn } from '@/utils/cn';

/**
 * Props para el componente Skeleton
 */
export interface SkeletonProps {
  /**
   * Variante del skeleton
   * - 'rectangular': Rectángulo con bordes redondeados (default)
   * - 'circular': Círculo completo
   * - 'text': Línea de texto (más delgada)
   */
  variant?: 'rectangular' | 'circular' | 'text';

  /**
   * Ancho del skeleton (puede ser string CSS o número en px)
   */
  width?: string | number;

  /**
   * Alto del skeleton (puede ser string CSS o número en px)
   */
  height?: string | number;

  /**
   * Tipo de animación
   * - 'pulse': Animación de pulsación suave (default)
   * - 'wave': Animación de onda shimmer
   * - 'none': Sin animación
   */
  animation?: 'pulse' | 'wave' | 'none';

  /**
   * Clase CSS adicional
   */
  className?: string;
}

/**
 * Componente Skeleton - Indicador de carga profesional
 *
 * Muestra un placeholder animado mientras el contenido se está cargando.
 * Ayuda a mejorar la percepción de rendimiento de la aplicación.
 *
 * @example
 * ```tsx
 * // Skeleton básico
 * <Skeleton width={200} height={20} />
 *
 * // Skeleton circular (avatar)
 * <Skeleton variant="circular" width={40} height={40} />
 *
 * // Skeleton de texto
 * <Skeleton variant="text" width="100%" />
 *
 * // Sin animación
 * <Skeleton animation="none" width={100} height={100} />
 * ```
 */
export const Skeleton: FC<SkeletonProps> = ({
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
  className,
}) => {
  const widthStyle = typeof width === 'number' ? `${width}px` : width;
  const heightStyle = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={cn(
        // Estilos base
        'bg-gray-200 dark:bg-gray-700',

        // Variantes de forma
        variant === 'circular' && 'rounded-full',
        variant === 'rectangular' && 'rounded-md',
        variant === 'text' && 'rounded-sm h-[1em] transform translate-y-[0.2em]',

        // Animaciones
        animation === 'pulse' && 'animate-pulse',
        animation === 'wave' &&
          'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent',

        className,
      )}
      style={{
        width: widthStyle,
        height: heightStyle,
      }}
      role="status"
      aria-label="Cargando..."
    />
  );
};

Skeleton.displayName = 'Skeleton';
