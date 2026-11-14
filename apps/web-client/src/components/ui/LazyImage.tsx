import { motion } from 'framer-motion';
import { useLazyImage } from '@/hooks/useLazyImage';
import { cn } from '@/utils/cn';

/**
 * LazyImage - Componente de imagen con lazy loading y responsive images
 *
 * Implementa lazy loading usando Intersection Observer y muestra
 * un skeleton loader mientras la imagen se carga.
 * Soporta srcset, sizes, WebP con fallback automático y modos de ajuste `cover` / `contain`.
 */

interface LazyImageProps {
  /** URL de la imagen a cargar */
  src: string;
  /** Texto alternativo para la imagen */
  alt: string;
  /** Clases CSS adicionales para el contenedor */
  className?: string;
  /** Clases CSS adicionales aplicadas directamente sobre el elemento <img> */
  imgClassName?: string;
  /** Modo de ajuste visual de la imagen ('cover' para tarjetas/portadas, 'contain' para visores completos sin recorte) */
  fit?: 'cover' | 'contain';
  /** Ancho intrínseco opcional para preservar aspect ratio previo a la carga */
  width?: number;
  /** Alto intrínseco opcional para preservar aspect ratio previo a la carga */
  height?: number;
  /** URL de placeholder opcional */
  placeholder?: string;
  /** srcset para responsive images (e.g., "image-320w.jpg 320w, image-640w.jpg 640w") */
  srcSet?: string;
  /** Tamaños para diferentes viewports (e.g., "(max-width: 600px) 100vw, 50vw") */
  sizes?: string;
  /** URL de la imagen WebP (se usará con <picture> si se provee) */
  webpSrc?: string;
  /** srcset para la imagen WebP */
  webpSrcSet?: string;
  /** Props adicionales para motion.img */
  [key: string]: unknown;
}

export const LazyImage = ({
  src,
  alt,
  className = '',
  imgClassName = '',
  fit = 'cover',
  width,
  height,
  placeholder,
  srcSet,
  sizes,
  webpSrc,
  webpSrcSet,
  ...props
}: LazyImageProps) => {
  const { imageSrc, isLoaded, imgRef } = useLazyImage(src, placeholder);

  // Autogenerar srcSet responsivo si es una URL de googleusercontent.com
  let finalSrcSet = srcSet;
  if (!srcSet && src && src.includes('googleusercontent.com')) {
    const baseUrl = src.split('=')[0];
    finalSrcSet = `${baseUrl}=w320 320w, ${baseUrl}=w640 640w, ${baseUrl}=w1024 1024w, ${baseUrl}=w1920 1920w`;
  }

  // Determinar si usamos <picture> (cuando hay WebP) o <img> simple
  const usePicture = !!(webpSrc || webpSrcSet);
  const isContain = fit === 'contain';

  const wrapperClasses = isContain
    ? cn(
        'relative flex items-center justify-center max-w-full max-h-full min-w-0 min-h-0',
        !isLoaded && 'min-w-[140px] min-h-[140px]',
        className,
      )
    : cn('relative overflow-hidden', className);

  const imageClasses = isContain
    ? cn(
        'block max-w-full max-h-full w-auto h-auto object-contain transition-opacity duration-500',
        isLoaded ? 'opacity-100' : 'opacity-0',
        imgClassName,
      )
    : cn(
        'w-full h-full object-cover transition-opacity duration-500',
        isLoaded ? 'opacity-100' : 'opacity-0',
        imgClassName,
      );

  return (
    <div className={wrapperClasses}>
      {/* Skeleton loader */}
      {!isLoaded && (
        <div className="absolute inset-0 rounded-lg bg-gray-800 animate-pulse">
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Picture con WebP o img simple */}
      {usePicture ? (
        <picture
          ref={imgRef as React.RefObject<HTMLPictureElement>}
          className={
            isContain
              ? 'flex items-center justify-center max-w-full max-h-full min-w-0 min-h-0'
              : 'block w-full h-full'
          }
        >
          {/* WebP source */}
          <source type="image/webp" srcSet={webpSrcSet || webpSrc} sizes={sizes} />
          {/* Fallback a formato original */}
          <motion.img
            src={imageSrc || undefined}
            srcSet={finalSrcSet}
            sizes={sizes}
            alt={alt}
            width={width}
            height={height}
            className={imageClasses}
            initial={{ opacity: 0 }}
            animate={{ opacity: isLoaded ? 1 : 0 }}
            transition={{ duration: 0.5 }}
            {...props}
          />
        </picture>
      ) : (
        <motion.img
          ref={imgRef}
          src={imageSrc || undefined}
          srcSet={finalSrcSet}
          sizes={sizes}
          alt={alt}
          width={width}
          height={height}
          className={imageClasses}
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.5 }}
          {...props}
        />
      )}
    </div>
  );
};
