import { motion } from 'framer-motion';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { IMAGES, TEXTS } from '@/constants/assets';
import { type GallerySymbolItem, SymbolFlipCard } from './SymbolFlipCard';

/**
 * GallerySection - Símbolos e Identidad del Pueblo Misak
 *
 * Exhibe con nitidez y sin recortes los emblemas oficiales (bandera-misak y escudo-misak)
 * con volteo 3D interactivo y lectura de significado cultural (Spec 009 Enmienda 0.3.0),
 * junto con el registro visual del equipo lingüístico del Resguardo de Guambia.
 */

const GALLERY_ITEMS: readonly GallerySymbolItem[] = [
  {
    id: 1,
    webpUrl: IMAGES.GALLERY.BANDERA_MISAK,
    url: IMAGES.GALLERY.BANDERA_MISAK_FALLBACK,
    alt: TEXTS.GALLERY.IMAGES[0].alt,
    title: TEXTS.GALLERY.IMAGES[0].title,
    subtitle: TEXTS.GALLERY.IMAGES[0].subtitle,
    containEmblem: true,
    details: TEXTS.GALLERY.IMAGES[0].details,
  },
  {
    id: 2,
    webpUrl: IMAGES.GALLERY.ESCUDO_MISAK,
    url: IMAGES.GALLERY.ESCUDO_MISAK_FALLBACK,
    alt: TEXTS.GALLERY.IMAGES[1].alt,
    title: TEXTS.GALLERY.IMAGES[1].title,
    subtitle: TEXTS.GALLERY.IMAGES[1].subtitle,
    containEmblem: true,
    details: TEXTS.GALLERY.IMAGES[1].details,
  },
  {
    id: 3,
    url: IMAGES.GALLERY.LINGUISTIC_TEAM_TEMP,
    alt: TEXTS.GALLERY.IMAGES[2].alt,
    title: TEXTS.GALLERY.IMAGES[2].title,
    subtitle: TEXTS.GALLERY.IMAGES[2].subtitle,
    containEmblem: false,
  },
];

export const GallerySection = () => {
  return (
    <section
      id="simbolos"
      aria-labelledby="simbolos-heading"
      className="min-h-dvh snap-start flex items-center justify-center bg-background px-4 sm:px-6 md:px-8 py-20"
    >
      <div className="max-w-6xl mx-auto w-full space-y-8">
        <SectionHeading id="simbolos-heading" className="max-w-2xl mx-auto">
          Símbolos del pueblo Misak
        </SectionHeading>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full"
        >
          {GALLERY_ITEMS.map((item, index) => (
            <SymbolFlipCard key={item.id} item={item} index={index} />
          ))}
        </motion.div>
      </div>
    </section>
  );
};
