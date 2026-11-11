import { motion } from 'framer-motion';
import { SemanticFieldButton } from '@/components/features/semantic-fields/SemanticFieldButton';
import { SemanticFieldsLayer } from '@/components/features/semantic-fields/SemanticFieldsLayer';
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

      {/* Contenido principal en 3 zonas verticales aisladas (Título superior · Constelación central · CTA inferior) */}
      <div className="relative z-10 flex flex-col items-center justify-between h-dvh min-h-dvh w-full px-3 sm:px-8 pt-[clamp(0.75rem,4.5dvh,4.5rem)] pb-[clamp(0.5rem,2.5dvh,2rem)] text-center">
        <div className="shrink-0 max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[clamp(2.5rem,9dvh,5.25rem)]">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isVisible ? 1 : 0 }}
            transition={{ duration: 0.4 }}
            className="text-fluid-hero font-bold text-white font-display tracking-tight leading-none"
            style={{
              textShadow: '0 4px 18px rgba(0, 0, 0, 0.82)',
              fontKerning: 'normal',
              fontSynthesis: 'none',
            }}
          >
            {displayText}
          </motion.h1>
        </div>

        {/* Capa interactiva de Campos Semánticos (estadio intermedio acotado sin colisión) */}
        <SemanticFieldsLayer />

        {/* 8.º Botón estandarizado "Campos Semánticos" + indicador de scroll */}
        <div className="relative z-20 shrink-0 flex flex-col items-center gap-[clamp(0.35rem,1.4dvh,0.875rem)]">
          <SemanticFieldButton
            variant="global-catalog"
            field={GLOBAL_CATALOG_BUTTON_CONFIG}
            layoutMode="spatial"
            to="/campos"
          />

          <motion.div
            className="flex justify-center"
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          >
            <svg
              className="w-[clamp(1.15rem,2.8dvh,1.5rem)] h-[clamp(1.15rem,2.8dvh,1.5rem)] text-white opacity-80"
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
