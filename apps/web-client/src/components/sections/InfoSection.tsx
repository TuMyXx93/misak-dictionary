import { motion } from 'framer-motion';
import { MisakSelvedgeDivider } from '@/components/ui/MisakBandStripe';
import { TEXTS } from '@/constants/assets';

const MISAK_COLOR_PILLARS = [
  { hex: '#E52D6D', name: 'Magenta', meaning: 'Fuerza vital y memoria de los mayores' },
  { hex: '#0055AA', name: 'Azul Piurek', meaning: 'Agua sagrada, páramo y sabiduría' },
  { hex: '#FFFFFF', name: 'Blanco', meaning: 'Claridad espiritual y palabra viva', ring: true },
  {
    hex: '#000000',
    name: 'Negro Nupirau',
    meaning: 'Madre Tierra y raíces ancestrales',
    darkRing: true,
  },
] as const;

/**
 * InfoSection - Sección narrativa "El Territorio como Metáfora"
 *
 * Articula la filosofía lingüística Misak junto con los cuatro pilares cromáticos
 * oficiales de su bandera y tejido tradicional.
 */
export const InfoSection = () => {
  return (
    <section className="relative min-h-dvh snap-start flex items-center justify-center bg-background px-4 sm:px-6 py-20 overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 65% 55% at 50% 45%, rgba(0, 85, 170, 0.16) 0%, rgba(229, 45, 109, 0.08) 48%, transparent 75%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75 }}
        viewport={{ once: true }}
        className="relative z-10 max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-10 rounded-3xl border border-[#0055AA]/40 bg-background-dark/80 backdrop-blur-sm text-center shadow-2xl"
      >
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#0055AA]/25 text-secondary-light border border-[#0055AA]/55 mb-4">
          Cosmovisión y Lengua Namtrik
        </span>

        <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">{TEXTS.INFO.TITLE}</h2>

        <p className="text-lg md:text-xl text-gray-200 leading-relaxed max-w-3xl mx-auto">
          {TEXTS.INFO.CONTENT}
        </p>

        <MisakSelvedgeDivider className="max-w-sm mx-auto my-8" />

        {/* Síntesis visual de los 4 colores de la comunidad Misak */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-left">
          {MISAK_COLOR_PILLARS.map((pillar) => (
            <div
              key={pillar.hex}
              className="p-3 rounded-2xl bg-black/60 border border-white/10 flex items-start gap-2.5"
            >
              <span
                aria-hidden="true"
                className="w-4 h-4 rounded-full shrink-0 mt-0.5 border border-white/30"
                style={{ backgroundColor: pillar.hex }}
              />
              <div className="min-w-0">
                <p className="text-xs font-display font-bold text-white truncate">{pillar.name}</p>
                <p className="text-[11px] text-text-muted/85 leading-snug mt-0.5">
                  {pillar.meaning}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};
