import { motion } from 'framer-motion';
import { LazyImage } from '@/components/ui/LazyImage';
import { MisakBandStripe } from '@/components/ui/MisakBandStripe';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { IMAGES, TEXTS } from '@/constants/assets';

/**
 * GallerySection - Símbolos e Identidad del Pueblo Misak
 *
 * Exhibe con nitidez y sin recortes los emblemas oficiales (bandera-misak y escudo-misak)
 * junto con el registro visual del equipo lingüístico del Resguardo de Guambia.
 */

interface GalleryCardItem {
  id: number;
  webpUrl?: string;
  url: string;
  alt: string;
  title: string;
  subtitle: string;
  containEmblem: boolean;
}

const GALLERY_ITEMS: readonly GalleryCardItem[] = [
  {
    id: 1,
    webpUrl: IMAGES.GALLERY.BANDERA_MISAK,
    url: IMAGES.GALLERY.BANDERA_MISAK_FALLBACK,
    alt: TEXTS.GALLERY.IMAGES[0].alt,
    title: TEXTS.GALLERY.IMAGES[0].title,
    subtitle: TEXTS.GALLERY.IMAGES[0].subtitle,
    containEmblem: true,
  },
  {
    id: 2,
    webpUrl: IMAGES.GALLERY.ESCUDO_MISAK,
    url: IMAGES.GALLERY.ESCUDO_MISAK_FALLBACK,
    alt: TEXTS.GALLERY.IMAGES[1].alt,
    title: TEXTS.GALLERY.IMAGES[1].title,
    subtitle: TEXTS.GALLERY.IMAGES[1].subtitle,
    containEmblem: true,
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
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: index * 0.15 }}
              viewport={{ once: true }}
              className="group relative overflow-hidden rounded-2xl border border-[#0055AA]/45 hover:border-[#E52D6D]/70 bg-background-dark/90 shadow-xl flex flex-col transition-colors"
            >
              <MisakBandStripe className="h-1" />

              {/* Vitrina visual cuadrada sin máscara oscura que tape los emblemas */}
              <div
                className="relative aspect-square w-full overflow-hidden flex items-center justify-center"
                style={{
                  background: item.containEmblem
                    ? 'radial-gradient(circle at 50% 45%, rgba(0, 85, 170, 0.28) 0%, rgba(229, 45, 109, 0.10) 48%, rgba(7, 9, 13, 0.96) 100%)'
                    : undefined,
                }}
              >
                {item.containEmblem ? (
                  <picture className="w-full h-full p-6 sm:p-8 flex items-center justify-center">
                    {item.webpUrl && <source srcSet={item.webpUrl} type="image/webp" />}
                    <img
                      src={item.url}
                      alt={item.alt}
                      loading="lazy"
                      decoding="async"
                      width={512}
                      height={512}
                      className="max-w-full max-h-full w-auto h-auto object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-105"
                    />
                  </picture>
                ) : (
                  <LazyImage
                    alt={item.alt}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    src={item.url}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                )}
              </div>

              {/* Pie editorial separado debajo de la imagen */}
              <div className="p-4 sm:p-5 border-t border-white/10 bg-black/80 text-center flex-1 flex flex-col justify-center">
                <p className="text-white text-xl font-display font-bold">{item.title}</p>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
