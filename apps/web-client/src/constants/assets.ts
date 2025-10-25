/**
 * Assets Constants
 *
 * Centraliza todas las URLs de imágenes, videos y otros assets
 */

// Imágenes
export const IMAGES = {
  HERO: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBSdhbfCazOBXFzZm4PsqrwqTzb4rEonWiFtWYx6Afm4cnFGmiM0s9bp3EWGJcWj4jgVYGGexcZ-Hif8XiYmzI8tIAtG0RPsYYrqkcxCKC4ZeEzx8gVl3kbbE2phAz5jEAiX9XbJ8qov7UHyQOZzp1zqgJ0k_35AzULyoWpNoY2Xq-J-GFhgGOUedy4LvxdNGHzq_RXuWXi_wiCrL8nHSVYOA-hlcJ4XavdC0rVb6VnI-x25cZbq-9iSpXuYAhEOmMXOdeabG61Hfo',
  GALLERY: {
    SPIRAL_TIME:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDvjn9OXj-p5ShNdSHK9QNTqGh-1kvkrVcQzymZtHS0xh9XIiHOXYg0MGuMlFUZn8TUISUqIAxtmOWVTLpU6RWsihvDOt0X6KApBJwffQyz5H9Y97PzyRL8DrfE0gwMVmUF0LKLnMNvGg6ezdb5p9TlZk65v2SfNQ1YZiiVR45WCnmRRY_Doi3bKZGzap2gfNnB5fapCb4FIj858h9NobE6q__HFpuCxT_sUPsdE20yz3VjQdME0rcl72i0rgMJjtH8Pv2yv2Egerg',
    WEAVING_KNOWLEDGE:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA-J9XIRmVqpDJFzCrfFfMg6NNsoNgWWeTj3jj7u3wfQk2A2GyJaFTL3Xz81JnSmfUVCkpwMBX1ZqCPViD28MJFNz8yz9B0KO_LtbwAsXdhEGg5qbYDOd2YSYlT4WIj8xDWxb_ceMoK4Kfi0lyu42r-327KL4YJVVh96_0B_c9aCvmdpauw795lXye-b_mrb2QdOoZdLAbl4ofkoOH1f-boU9ncCA4maMKxP_GD3i6Rihsk87cliy5kBV7Y-SiySkkohY1vAyTNuuI',
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
      { title: 'Logo bandera de Guambia', alt: 'Bandera de Guambia' },
      { title: 'Logo escudo de Guambia', alt: 'Escudo de Guambia' },
      { title: 'Logo equipo lingüístico', alt: 'Equipo lingüístico de Guambia' },
    ],
  },
  CREDITS: {
    TITLE: 'Créditos',
    ORGANIZATION: 'Cabildo Indígena del Resguardo de Guambia – 2025',
    AUTHORITIES: {
      GOBERNADORA: 'Máma, Liliana Pechené Muelas – Gobernadora',
      VICEGOBERNADOR: 'Taita, Esteban Ussa Tombé – Vicegobernador',
    },
    CONTACT_TITLE: 'Contacto',
    EMAILS: [
      'lingumisak@gmail.com',
      'gyalanda@edumisak.edu.co',
      'barmuel@gmail.com',
      'cabildoguambia@yahoo.es',
    ],
  },
} as const;
