import { motion } from 'framer-motion';
import { SemanticFieldsLayer } from '@/components/features/semantic-fields';
import { SemanticFieldButton } from '@/components/features/semantic-fields/SemanticFieldButton';
import { IMAGES } from '@/constants/assets';
import { GLOBAL_CATALOG_BUTTON_CONFIG } from '@/constants/semanticFields';
import { useRotatingText } from '@/hooks/useRotatingText';
import { MISAK_BRAND_NAME } from '@/utils/namtrikText';

const HERO_TEXTS = [
  'Bienvenidos a',
  MISAK_BRAND_NAME,
  'Diccionario Misak',
  'Namtrik – Castellano',
] as const;

/**
 * HeroSection - Sección de landing principal
 *
 * Integra orgánicamente los 4 colores oficiales de la bandera Misak
 * (#E52D6D, #0055AA, #FFFFFF, #000000), imagen LCP prioritaria (fetchpriority="high")
 * y capa interactiva mobile-first de campos semánticos.
 */
export const HeroSection = () => {
  const { displayText, isVisible } = useRotatingText({
    texts: Array.from(HERO_TEXTS),
    intervalMs: 4000,
    fadeDurationMs: 400,
  });

  return (
    <section
      id="inicio"
      className="relative min-h-dvh snap-start flex flex-col items-center justify-between overflow-hidden bg-black"
    >
      {/* Imagen LCP de fondo optimizada (sin loading="lazy" + fetchPriority="high") */}
      <div className="absolute inset-0 z-0">
        <img
          src={IMAGES.HERO}
          alt="Territorio Misak"
          fetchPriority="high"
          decoding="async"
          width={1920}
          height={1080}
          className="h-full w-full object-cover"
        />
        {/* Velo atmosférico Azul Misak (#0055AA — lagunas Piurek y horizonte andino) */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 85% 55% at 50% 8%, rgba(0, 85, 170, 0.44) 0%, rgba(0, 85, 170, 0.14) 52%, transparent 80%)',
          }}
        />
        {/* Acento cálido sutil Magenta Misak (#E52D6D) */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 18% 82%, rgba(229, 45, 109, 0.22) 0%, transparent 45%)',
          }}
        />
        {/* Gradient overlay hacia el lienzo negro Nupirau (#000000) */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-black/30 to-black/55" />
      </div>

      {/* Contenido principal */}
      <div className="relative z-10 flex flex-col items-center justify-between min-h-dvh w-full px-4 sm:px-8 pt-16 sm:pt-22 pb-8 sm:pb-8 text-center">
        <div className="max-w-3xl mx-auto mt-2 sm:mt-4 flex flex-col items-center gap-3">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: isVisible ? 1 : 0 }}
            transition={{ duration: 0.4 }}
            className="text-fluid-hero font-bold text-white font-display tracking-tight"
            style={{
              textShadow: '0 4px 18px rgba(0, 0, 0, 0.82)',
              fontKerning: 'normal',
              fontSynthesis: 'none',
            }}
          >
            {displayText}
          </motion.h1>
        </div>

        {/* Capa interactiva de Campos Semánticos (8 botones unificados) */}
        <SemanticFieldsLayer />

        {/* 8.º Botón estandarizado "Campos Semánticos" + indicador de scroll */}
        <div className="relative z-20 flex flex-col items-center gap-3.5 mt-2">
          <SemanticFieldButton
            variant="global-catalog"
            field={GLOBAL_CATALOG_BUTTON_CONFIG}
            to="/campos"
          />

          <motion.div
            className="flex justify-center"
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          >
            <svg
              className="w-6 h-6 text-white opacity-80"
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
      </div>
    </section>
  );
};
