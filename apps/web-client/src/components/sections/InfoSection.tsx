import { motion } from 'framer-motion';
import { TEXTS } from '@/constants/assets';

/**
 * InfoSection - Sección informativa
 *
 * Presenta el texto sobre "El Territorio como Metáfora"
 */

export const InfoSection = () => {
  return (
    <section className="h-screen snap-start flex items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="max-w-4xl mx-auto px-8 text-center"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">{TEXTS.INFO.TITLE}</h2>
        <p className="text-lg md:text-xl text-gray-300 leading-relaxed">{TEXTS.INFO.CONTENT}</p>
      </motion.div>
    </section>
  );
};
