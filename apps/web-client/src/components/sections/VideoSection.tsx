import { motion } from 'framer-motion';
import { MisakSelvedgeDivider } from '@/components/ui/MisakBandStripe';
import { VIDEOS } from '@/constants/assets';

/**
 * VideoSection - Sección con video de recorrido territorial
 *
 * Enmarcada con el Azul Misak (#0055AA) y el motivo textil del orillo cuatricolor,
 * usando min-h-dvh para evitar recortes en navegadores móviles.
 */
export const VideoSection = () => {
  const videoUrl = `https://www.youtube.com/embed/${VIDEOS.RECORRIDO.ID}?autoplay=0&controls=1&modestbranding=1&rel=0&start=${VIDEOS.RECORRIDO.START_TIME}`;

  return (
    <section
      id="recorrido"
      className="relative min-h-dvh snap-start flex items-center justify-center bg-background px-4 sm:px-6 py-20 overflow-hidden"
    >
      {/* Resplandor sutil Azul Misak (#0055AA) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(0, 85, 170, 0.22) 0%, transparent 72%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7 }}
        viewport={{ once: true }}
        className="relative z-10 w-full max-w-4xl space-y-5"
      >
        <div className="text-center space-y-2">
          <h2 className="text-fluid-h2 font-display font-bold text-white">
            Recorrido del territorio Misak
          </h2>
        </div>

        <div className="p-1.5 sm:p-2 rounded-2xl bg-gradient-to-br from-[#E52D6D]/50 via-[#0055AA]/65 to-white/15 shadow-2xl">
          <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
            <iframe
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
              className="w-full h-full rounded-lg shadow-2xl"
              src={videoUrl}
              title="Recorrido del territorio Misak"
            />
          </div>
        </div>

        <MisakSelvedgeDivider className="max-w-xs mx-auto opacity-85" />
      </motion.div>
    </section>
  );
};
