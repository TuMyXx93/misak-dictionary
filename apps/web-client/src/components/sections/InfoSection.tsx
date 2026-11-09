import { motion } from 'framer-motion';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { TEXTS } from '@/constants/assets';

/**
 * InfoSection - Sección narrativa "El Territorio como Metáfora"
 *
 * Articula la filosofía lingüística Misak junto con los cuatro pilares cromáticos
 * oficiales de su bandera y tejido tradicional.
 */
export const InfoSection = () => {
  return (
    <section
      id="territorio-metafora"
      aria-labelledby="info-heading"
      className="relative min-h-dvh snap-start flex items-center justify-center bg-background px-4 sm:px-6 py-20 overflow-hidden"
    >
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
        <SectionHeading id="info-heading" className="mb-6">
          {TEXTS.INFO.TITLE}
        </SectionHeading>

        <p className="text-lg md:text-xl text-gray-200 leading-relaxed max-w-3xl mx-auto">
          {TEXTS.INFO.CONTENT}
        </p>
      </motion.div>
    </section>
  );
};
