import { motion } from 'framer-motion';

/**
 * HeroSection - Sección de landing principal
 *
 * Presenta la imagen del territorio Misak con título y hotspot interactivo
 */

const HERO_IMAGE_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBSdhbfCazOBXFzZm4PsqrwqTzb4rEonWiFtWYx6Afm4cnFGmiM0s9bp3EWGJcWj4jgVYGGexcZ-Hif8XiYmzI8tIAtG0RPsYYrqkcxCKC4ZeEzx8gVl3kbbE2phAz5jEAiX9XbJ8qov7UHyQOZzp1zqgJ0k_35AzULyoWpNoY2Xq-J-GFhgGOUedy4LvxdNGHzq_RXuWXi_wiCrL8nHSVYOA-hlcJ4XavdC0rVb6VnI-x25cZbq-9iSpXuYAhEOmMXOdeabG61Hfo';

export const HeroSection = () => {
  return (
    <section className="relative h-screen snap-start flex flex-col items-center justify-end">
      {/* Imagen de fondo */}
      <div className="absolute inset-0 z-0">
        <img alt="Territorio Misak" className="h-full w-full object-cover" src={HERO_IMAGE_URL} />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      {/* Hotspot interactivo (centro) */}
      <a
        href="#recorrido"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 group"
      >
        <motion.div
          className="w-8 h-8 bg-primary/70 rounded-full cursor-pointer flex items-center justify-center"
          whileHover={{ scale: 1.2, backgroundColor: 'rgba(56, 224, 123, 1)' }}
          transition={{ duration: 0.3 }}
        >
          <span className="sr-only">Campo semántico 1: Wallikatɵ</span>
        </motion.div>

        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-secondary text-text px-4 py-2 rounded-lg text-sm whitespace-nowrap shadow-lg">
            Campo semántico 1: Wallikatɵ
          </div>
        </div>
      </a>

      {/* Contenido */}
      <div className="relative z-10 flex flex-col items-center justify-end h-screen p-8 text-center">
        <div className="max-w-2xl mx-auto mb-24">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl md:text-6xl font-bold text-white mb-8"
            style={{ textShadow: '2px 2px 8px rgba(0, 0, 0, 0.7)' }}
          >
            Diccionario Misak
          </motion.h1>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.div>
      </div>
    </section>
  );
};
