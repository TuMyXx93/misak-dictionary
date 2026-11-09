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
    LINGUISTIC_TEAM_TEMP: 'https://api.iconify.design/mdi/book-open-variant.svg?color=%23E52D6D',
  },
} as const;

// Videos
export const VIDEOS = {
  RECORRIDO: {
    ID: 'uGVUog2ZoAc',
    START_TIME: 0,
  },
} as const;

export interface SymbolCardDetails {
  readonly intro: string;
  readonly items: readonly string[];
  readonly outro: string;
}

export interface GalleryImageText {
  readonly title: string;
  readonly subtitle: string;
  readonly alt: string;
  readonly details?: SymbolCardDetails;
}

// Textos
export const TEXTS = {
  HERO: {
    TITLE: 'Diccionario Misak',
  },
  INFO: {
    TITLE: 'El Territorio como metáfora',
    CONTENT:
      'El Diccionario Misak no es solo una colección de palabras; es una invitación a explorar el mundo a través de la cosmovisión Misak. El territorio, con sus ríos, montañas y seres, se convierte en una gran metáfora viviente que da forma al lenguaje y al pensamiento. Cada término está enraizado en un lugar, en una historia, en una práctica cultural. Al navegar por este diccionario, no solo aprendes un idioma, sino que recorres un paisaje, descubriendo la profunda conexión entre la palabra y la tierra. Te invitamos a sumergirte en esta experiencia narrativa, donde los campos semánticos te guiarán como senderos a través del conocimiento ancestral Misak.',
  },
  GALLERY: {
    IMAGES: [
      {
        title: 'Bandera del pueblo Misak',
        subtitle: 'Magenta · Azul Piurek · Blanco · Negro Nupirau',
        alt: 'Bandera oficial del Pueblo Misak con cuatro franjas horizontales y bastón de mando',
        details: {
          intro:
            'La bandera Guambiana está conformada por cuatro franjas horizontales con los siguientes colores:',
          items: [
            'Fucsia: Por la armonía y respeto hacia nuestros antepasados, siguiendo la línea ideológica de la vida indígena guambiana.',
            'Azul: Por nuestro vestido de hoy, sea de hombre o de mujer, y por el aire puro que respiramos en las montañas.',
            'Blanco: Por la pureza, fidelidad y cumplimiento de todos los actos; también por la paz y la alegría del matrimonio, resaltando el atuendo nupcial.',
            'Negro: Por nuestra madre tierra, porque allí nacemos, en ella trabajamos mientras vivimos y, cuando expiramos, nos abriga para siempre en su seno. En el borde inferior, esta franja lleva una lista con los colores de la bandera y significa el intercambio de ideas, cooperación de trabajos y combinación de las pinturas. La lista más pequeña es blanca y roja, donde el rojo significa la sangre pura del indígena guambiano.',
            'Por último, el acabado demuestra el espíritu del trabajo y las habilidades artesanales de la mujer guambiana.',
          ],
          outro:
            'Nuestra Bandera Guambiana fue creada en 1.980; su raíz es la recuperación de tierras y la idea de crearla fue del Taita Vicente Tombé, residente en la vereda Ñimbe, quien tuvo en cuenta un sueño y los colores del atuendo típico del hombre y de la mujer, las actividades del campo y el sistema de gobierno. La Bandera va colocada en un bastón de mando que sirve de asta y que en la parte superior lleva un machete con el mango de color verde selva, que significa las faenas diarias de la agricultura. La bandera va asegurada en el asta por un cordón trenzado a mano, que termina en dos borlas y con los colores ya mencionados.',
        },
      },
      {
        title: 'Escudo del pueblo Misak',
        subtitle: 'Autoridad ancestral, territorio y palabra viva',
        alt: 'Escudo oficial del Resguardo Indígena de Guambia con bastón de mando y bandera Misak',
        details: {
          intro: 'El significado del escudo es el siguiente:',
          items: [
            'El fondo azul claro, es el Kɵtrak, “páramo”.',
            'El cerro del Purayatun que se ve al fondo con un verde oscuro, es el Kausrɵ.',
            'Las huellas de los antepasados representan la dualidad y la historia que va adelante y es nuestro pasado.',
            'El verde claro representa el Wampik, que significa el caminar en el valle grande, y el contraste de verdes es para mostrar la profundidad del paisaje natural.',
            'La Bandera Tsurɵpall le da la vuelta al mundo guambiano, al territorio grande, y significa las luchas del pasado, del presente y del futuro.',
            'El bastón de mando significa la autoridad y termina en un machete que significa el trabajo, la laboriosidad constante y milenaria de los guambianos.',
            'Los colores significan: el rojo, la vida; el azul, la identidad de la comunidad guambiana; el blanco es el pishintɵ waramik, “la paz y la armonía”; y el negro, la tierra y el territorio.',
          ],
          outro:
            'El Escudo guambiano fue creado mediante un concurso dirigido a los maestros y estudiantes del resguardo, siguiendo las pautas discutidas por los taitas y el cabildo de 1.988. El Escudo es el Nuisuik, “nuestro pensamiento filosófico y nuestras luchas en todos los tiempos”. El Nuisuik es todo lo que nos hace guambianos y está formado por los siguientes elementos: política, territorio, autoridad, lengua, educación, salud, justicia, identidad, cultura, pensamiento, ciclo de vida y cosmovisión.',
        },
      },
      {
        title: 'Logo del equipo lingüístico Misak',
        subtitle: 'Investigación comunitaria Namtrik – Castellano',
        alt: 'Icono temporal de libro abierto para el equipo lingüístico Misak',
      },
    ] satisfies readonly GalleryImageText[],
  },
  CREDITS: {
    TITLE: 'Créditos',
    ORGANIZATION: 'Cabildo indígena del resguardo de Guambia – 2025',
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
