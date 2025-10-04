import { motion } from 'framer-motion';

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
        <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">
          El Territorio como Metáfora
        </h2>
        <p className="text-lg md:text-xl text-gray-300 leading-relaxed">
          El Diccionario Misak no es solo una colección de palabras; es una invitación a explorar el
          mundo a través de la cosmovisión Misak. El territorio, con sus ríos, montañas y seres, se
          convierte en una gran metáfora viviente que da forma al lenguaje y al pensamiento. Cada
          término está enraizado en un lugar, en una historia, en una práctica cultural. Al navegar
          por este diccionario, no solo aprendes un idioma, sino que recorres un paisaje,
          descubriendo la profunda conexión entre la palabra y la tierra. Te invitamos a sumergirte
          en esta experiencia narrativa, donde los campos semánticos te guiarán como senderos a
          través del conocimiento ancestral Misak.
        </p>
      </motion.div>
    </section>
  );
};
