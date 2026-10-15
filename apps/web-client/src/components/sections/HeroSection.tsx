import { motion } from 'framer-motion';
import { SemanticFieldsLayer } from '@/components/features/semantic-fields';
import { LazyImage } from '@/components/ui/LazyImage';
import { IMAGES } from '@/constants/assets';
import { useRotatingText } from '@/hooks/useRotatingText';

const HERO_TEXTS = [
  'Bienvenidos a',
  'WAMTƟRMARƟPIK',
  'Diccionario Misak',
  'Namtrik – Castellano',
] as const;

/**
 * HeroSection - Sección de landing principal
 *
 * Presenta la imagen del territorio Misak con título rotativo
 * y la capa interactiva de campos semánticos.
 */
export const HeroSection = () => {
  const { displayText, isVisible } = useRotatingText({
    texts: Array.from(HERO_TEXTS),
    intervalMs: 4000,
    fadeDurationMs: 400,
  });

  return (
    <section className="relative min-h-dvh h-screen snap-start flex flex-col items-center justify-start overflow-hidden">
      {/* Imagen de fondo */}
      <div className="absolute inset-0 z-0">
        <LazyImage alt="Territorio Misak" className="h-full w-full" src={IMAGES.HERO} />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      {/* Contenido */}
      <div className="relative z-10 flex flex-col items-center justify-between h-full w-full p-6 sm:p-8 text-center pt-20 sm:pt-24 pb-20 sm:pb-8">
        <div className="max-w-2xl mx-auto mb-4">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: isVisible ? 1 : 0 }}
            transition={{ duration: 0.4 }}
            className="text-fluid-hero font-bold text-white font-display"
            style={{ textShadow: '2px 2px 8px rgba(0, 0, 0, 0.7)' }}
          >
            {displayText}
          </motion.h1>
        </div>

        {/* Semantic Fields Layer */}
        <SemanticFieldsLayer />

        {/* Scroll indicator */}
        <motion.div
          className="flex justify-center"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          <svg
            className="w-8 h-8 text-white opacity-80"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.div>
      </div>
    </section>
  );
};
