import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { SemanticFieldsLayer } from '@/components/features/semantic-fields';
import { MisakBandStripe } from '@/components/ui/MisakBandStripe';
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
    <section className="relative min-h-dvh snap-start flex flex-col items-center justify-between overflow-hidden bg-black">
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
      <div className="relative z-10 flex flex-col items-center justify-between min-h-dvh w-full px-4 sm:px-8 pt-20 sm:pt-24 pb-10 sm:pb-8 text-center">
        <div className="max-w-3xl mx-auto mt-2 sm:mt-4 flex flex-col items-center gap-3">
          {/* Insignia institucional con bandera cuatricolor apilada */}
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-black/65 backdrop-blur-md border border-[#0055AA]/70 shadow-md">
            <MisakBandStripe variant="stacked" className="w-4 h-3.5" />
            <span className="text-[11px] sm:text-xs font-semibold tracking-wider uppercase text-white/95">
              Pueblo Misak · Resguardo de Guambia
            </span>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: isVisible ? 1 : 0 }}
            transition={{ duration: 0.4 }}
            className="text-fluid-hero font-bold text-white font-display tracking-tight"
            style={{ textShadow: '0 4px 18px rgba(0, 0, 0, 0.82)' }}
          >
            {displayText}
          </motion.h1>

          <p className="text-xs sm:text-sm md:text-base text-text-muted max-w-xl leading-relaxed drop-shadow-sm">
            Explora la palabra viva a través del territorio, la memoria oral y los campos semánticos
            ancestrales.
          </p>
        </div>

        {/* Capa interactiva de Campos Semánticos */}
        <SemanticFieldsLayer />

        {/* Barra inferior de acción rápida + indicador de scroll */}
        <div className="relative z-20 flex flex-col items-center gap-4 mt-2">
          <Link
            to="/campos"
            className="inline-flex items-center gap-2.5 min-h-[46px] px-5 py-2.5 rounded-full bg-[#0055AA] hover:bg-[#004488] text-white text-sm font-semibold border border-white/25 shadow-lg shadow-black/50 transition-all hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E52D6D] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            <span className="w-2 h-2 rounded-full bg-[#E52D6D]" aria-hidden="true" />
            <span>Explorar Campos Semánticos</span>
            <span aria-hidden="true">→</span>
          </Link>

          <motion.div
            className="flex justify-center"
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          >
            <svg
              className="w-7 h-7 text-white opacity-85"
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
