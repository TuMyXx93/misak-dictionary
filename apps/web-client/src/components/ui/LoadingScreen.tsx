import { motion } from 'framer-motion';

/**
 * LoadingScreen - Componente de carga para Suspense boundaries
 *
 * Muestra una animación profesional mientras se cargan componentes lazy.
 * Diseñado para ser ligero y mantener la identidad visual del proyecto.
 */
export const LoadingScreen = () => {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        {/* Logo animado */}
        <motion.div
          className="flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="h-16 w-16 rounded-full border-4 border-primary border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </motion.div>

        {/* Texto de carga */}
        <motion.p
          className="text-lg text-text/70"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          Cargando...
        </motion.p>

        {/* Puntos animados */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-2 w-2 rounded-full bg-primary"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
