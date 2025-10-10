import { motion } from 'framer-motion';
import { IMAGES, TEXTS } from '@/constants/assets';
import { LazyImage } from '@/components/ui/LazyImage';

/**
 * GallerySection - Galería de imágenes
 *
 * Grid de 3 imágenes con efectos hover y overlays
 */

const GALLERY_IMAGES = [
  {
    id: 1,
    url: IMAGES.GALLERY.SPIRAL_TIME,
    alt: TEXTS.GALLERY.IMAGES[0].alt,
    title: TEXTS.GALLERY.IMAGES[0].title,
  },
  {
    id: 2,
    url: IMAGES.GALLERY.WEAVING_KNOWLEDGE,
    alt: TEXTS.GALLERY.IMAGES[1].alt,
    title: TEXTS.GALLERY.IMAGES[1].title,
  },
  {
    id: 3,
    url: IMAGES.GALLERY.VOICES_EARTH,
    alt: TEXTS.GALLERY.IMAGES[2].alt,
    title: TEXTS.GALLERY.IMAGES[2].title,
  },
];

export const GallerySection = () => {
  return (
    <section className="h-screen snap-start flex items-center justify-center bg-background px-8">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-6xl mx-auto w-full"
      >
        {GALLERY_IMAGES.map((image, index) => (
          <motion.div
            key={image.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.2 }}
            viewport={{ once: true }}
            className="group relative overflow-hidden rounded-lg shadow-lg aspect-square"
          >
            <motion.div
              className="w-full h-full"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.5 }}
            >
              <LazyImage alt={image.alt} className="w-full h-full" src={image.url} />
            </motion.div>
            {/* Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
              <p className="text-white text-xl font-bold px-4 text-center">{image.title}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};
