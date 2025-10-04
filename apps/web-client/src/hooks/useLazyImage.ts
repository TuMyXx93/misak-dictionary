import { useEffect, useRef, useState } from 'react';

/**
 * Hook para lazy loading de imágenes usando Intersection Observer
 *
 * @param src - URL de la imagen a cargar
 * @param placeholder - URL de placeholder opcional
 * @returns Estado de carga y ref para el elemento
 */
export const useLazyImage = (src: string, placeholder?: string) => {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    let observer: IntersectionObserver;
    const imgElement = imgRef.current;

    if (imgElement) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              // Cuando la imagen entra en el viewport, cargarla
              setImageSrc(src);
              setIsLoaded(true);
              observer.unobserve(entry.target);
            }
          });
        },
        {
          // Empezar a cargar cuando esté a 100px del viewport
          rootMargin: '100px',
        },
      );

      observer.observe(imgElement);
    }

    return () => {
      if (observer && imgElement) {
        observer.unobserve(imgElement);
      }
    };
  }, [src]);

  return { imageSrc, isLoaded, imgRef };
};
