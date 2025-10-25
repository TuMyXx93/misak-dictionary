import { motion } from 'framer-motion';
import { IMAGES, TEXTS } from '@/constants/assets';
import { LazyImage } from '@/components/ui/LazyImage';

/**
 * HeroSection - Sección de landing principal
 *
 * Presenta la imagen del territorio Misak con título
 */

export const HeroSection = () => {
  return (
    <section className="relative h-screen snap-start flex flex-col items-center justify-end">
      {/* Imagen de fondo */}
      <div className="absolute inset-0 z-0">
        <LazyImage alt="Territorio Misak" className="h-full w-full" src={IMAGES.HERO} />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      {/* Contenido */}
      <div className="relative z-10 flex flex-col items-center justify-end h-screen p-8 text-center">
        <div className="max-w-2xl mx-auto mb-24">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl md:text-6xl font-bold text-white mb-8"
            style={{ textShadow: '2px 2px 8px rgba(0, 0, 0, 0.7)' }}
          >
            {TEXTS.HERO.TITLE}
          </motion.h1>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.div>
      </div>
    </section>
  );
};
