import { motion } from 'framer-motion';
import type { FC } from 'react';
import { MainLayout } from '@/components/layouts/MainLayout';

/**
 * Página 404 Not Found
 *
 * Página personalizada que se muestra cuando el usuario navega a una ruta que no existe.
 * Diseñada para ser amigable y proporcionar opciones útiles de navegación.
 *
 * Features:
 * - Diseño consistente con el resto de la aplicación
 * - Animaciones suaves de entrada
 * - Links útiles para volver al inicio
 * - Mensaje claro y amigable
 * - Responsive design
 * - SEO friendly
 */
export const NotFound: FC = () => {
  return (
    <MainLayout>
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          {/* Número 404 grande */}
          <motion.h1
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{
              duration: 0.5,
              type: 'spring',
              stiffness: 200,
              damping: 15,
            }}
            className="mb-4 text-9xl font-bold text-primary"
            aria-label="Error 404"
          >
            404
          </motion.h1>

          {/* Título descriptivo */}
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-4 text-3xl font-bold text-text md:text-4xl"
          >
            Página no encontrada
          </motion.h2>

          {/* Mensaje descriptivo */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mb-8 max-w-md text-text-muted"
          >
            Lo sentimos, la página que buscas no existe o ha sido movida. Por favor, verifica la URL
            o regresa al inicio.
          </motion.p>

          {/* Botón para volver al inicio */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <a
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 font-semibold text-background transition-colors duration-200 hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
              aria-label="Volver a la página de inicio"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Volver al inicio
            </a>
          </motion.div>

          {/* Decoración adicional: mensaje en Misak (opcional) */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-12 text-sm text-text-disabled"
            lang="es"
          >
            Esta página no está disponible
          </motion.p>
        </motion.div>
      </div>
    </MainLayout>
  );
};

NotFound.displayName = 'NotFound';
