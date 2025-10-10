import { motion } from 'framer-motion';
import { useLazyImage } from '@/hooks/useLazyImage';

/**
 * LazyImage - Componente de imagen con lazy loading
 *
 * Implementa lazy loading usando Intersection Observer y muestra
 * un skeleton loader mientras la imagen se carga
 */

interface LazyImageProps {
  /** URL de la imagen a cargar */
  src: string;
  /** Texto alternativo para la imagen */
  alt: string;
  /** Clases CSS adicionales */
  className?: string;
  /** URL de placeholder opcional */
  placeholder?: string;
  /** Props adicionales para motion.img */
  [key: string]: unknown;
}

export const LazyImage = ({ src, alt, className = '', placeholder, ...props }: LazyImageProps) => {
  const { imageSrc, isLoaded, imgRef } = useLazyImage(src, placeholder);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Skeleton loader */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-800 animate-pulse">
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
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

      {/* Imagen real */}
      <motion.img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-500 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        {...props}
      />
    </div>
  );
};
