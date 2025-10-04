import { motion } from 'framer-motion';

/**
 * VideoSection - Sección con video de recorrido
 *
 * Presenta el video embebido de YouTube sobre el recorrido del territorio
 */

const VIDEO_ID = 'uGVUog2ZoAc';
const VIDEO_START_TIME = 6;

export const VideoSection = () => {
  const videoUrl = `https://www.youtube.com/embed/${VIDEO_ID}?autoplay=0&controls=1&modestbranding=1&rel=0&start=${VIDEO_START_TIME}`;

  return (
    <section
      id="recorrido"
      className="h-screen snap-start flex items-center justify-center bg-background px-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="w-full max-w-4xl aspect-video"
      >
        <iframe
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full rounded-lg shadow-2xl"
          src={videoUrl}
          title="Recorrido del Territorio Misak"
        />
      </motion.div>
    </section>
  );
};
