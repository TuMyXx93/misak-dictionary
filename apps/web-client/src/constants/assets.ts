/**
 * Assets Constants
 *
 * Centraliza las rutas de emblemas oficiales Misak (Resguardo de Guambia),
 * recursos audiovisuales y textos institucionales del portal.
 */

export const BRAND_ASSETS = {
  BANDERA_WEBP: '/brand/bandera-misak.webp',
  BANDERA_PNG: '/brand/bandera-misak.png',
  ESCUDO_WEBP: '/brand/escudo-misak.webp',
  ESCUDO_PNG: '/brand/escudo-misak.png',
} as const;

// Imágenes
export const IMAGES = {
  HERO: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBSdhbfCazOBXFzZm4PsqrwqTzb4rEonWiFtWYx6Afm4cnFGmiM0s9bp3EWGJcWj4jgVYGGexcZ-Hif8XiYmzI8tIAtG0RPsYYrqkcxCKC4ZeEzx8gVl3kbbE2phAz5jEAiX9XbJ8qov7UHyQOZzp1zqgJ0k_35AzULyoWpNoY2Xq-J-GFhgGOUedy4LvxdNGHzq_RXuWXi_wiCrL8nHSVYOA-hlcJ4XavdC0rVb6VnI-x25cZbq-9iSpXuYAhEOmMXOdeabG61Hfo',
  GALLERY: {
    BANDERA_MISAK: BRAND_ASSETS.BANDERA_WEBP,
    BANDERA_MISAK_FALLBACK: BRAND_ASSETS.BANDERA_PNG,
    ESCUDO_MISAK: BRAND_ASSETS.ESCUDO_WEBP,
    ESCUDO_MISAK_FALLBACK: BRAND_ASSETS.ESCUDO_PNG,
    VOICES_EARTH:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDJTM1IiNIJ9qxf948sKXZ_QYjPl4ZNExsRhR7miAvFemK9CD1yXITUa5YwJ5w5MumZh0aO34tu7K0FSs7bNdwjOv6VMg7mh43eANIXLuv3CLu_2u02QUiohIm0G51RW_R0buxjBdSJBuVcl3WYewoo7GgifBe30vZtbYvk0AbfCg2_afDR4TSDtcaSy-joSH0xU_8t6AsaaWKAecsKsGmFS0UnjT6ZGFcuMz5U354mSVzv0FyJaeDj4pCz87c3QEo1ODJO7tP3lUM',
  },
} as const;

// Videos
export const VIDEOS = {
  RECORRIDO: {
    ID: 'uGVUog2ZoAc',
    START_TIME: 0,
  },
} as const;

// Textos
export const TEXTS = {
  HERO: {
    TITLE: 'Diccionario Misak',
  },
  INFO: {
    TITLE: 'El Territorio como Metáfora',
    CONTENT:
      'El Diccionario Misak no es solo una colección de palabras; es una invitación a explorar el mundo a través de la cosmovisión Misak. El territorio, con sus ríos, montañas y seres, se convierte en una gran metáfora viviente que da forma al lenguaje y al pensamiento. Cada término está enraizado en un lugar, en una historia, en una práctica cultural. Al navegar por este diccionario, no solo aprendes un idioma, sino que recorres un paisaje, descubriendo la profunda conexión entre la palabra y la tierra. Te invitamos a sumergirte en esta experiencia narrativa, donde los campos semánticos te guiarán como senderos a través del conocimiento ancestral Misak.',
  },
  GALLERY: {
    IMAGES: [
      {
        title: 'Bandera del Pueblo Misak',
        subtitle: 'Magenta · Azul Piurek · Blanco · Negro Nupirau',
        alt: 'Bandera oficial del Pueblo Misak con cuatro franjas horizontales y bastón de mando',
      },
      {
        title: 'Escudo del Resguardo de Guambia',
        subtitle: 'Autoridad ancestral, territorio y palabra viva',
        alt: 'Escudo oficial del Resguardo Indígena de Guambia con bastón de mando y bandera Misak',
      },
      {
        title: 'Equipo Lingüístico Misak',
        subtitle: 'Investigación comunitaria Namtrik – Castellano',
        alt: 'Equipo lingüístico comunitario del Resguardo de Guambia',
      },
    ],
  },
  CREDITS: {
    TITLE: 'Créditos Institucionales',
    ORGANIZATION: 'Cabildo Indígena del Resguardo de Guambia – 2025',
    AUTHORITIES: {
      GOBERNADORA: 'Máma, Liliana Pechené Muelas – Gobernadora',
      VICEGOBERNADOR: 'Taita, Esteban Ussa Tombé – Vicegobernador',
    },
    CONTACT_TITLE: 'Contacto',
    EMAILS: [
      'cabildoguambia@yahoo.es',
      'lingumisak@gmail.com',
      'barmuel@gmail.com',
      'gyalanda@edumisak.edu.co',
    ],
  },
} as const;
