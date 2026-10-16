/**
 * CamposIndex Page — Spec 003: datos reales desde la API
 *
 * Grid overview de los campos semánticos. El contenido (nombres,
 * descripciones, jerarquía) viene de GET /api/dictionary/semantic-fields;
 * la configuración de presentación (icono, posiciones) permanece en
 * constants y se une por slug (R-009).
 */

import { SearchBox } from '@components/features/semantic-fields/SearchBox';
import { SemanticFieldIcon } from '@components/features/semantic-fields/SemanticFieldIcon';
import { FieldLayout } from '@components/layouts/FieldLayout';
import { DataError, DataLoading } from '@components/ui/QueryBoundary';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getSemanticFieldConfig } from '@/constants/semanticFields';
import { useSemanticFields } from '@/hooks/useDictionary';

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
} as const;

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'tween' as const,
      ease: 'easeOut' as const,
      duration: 0.4,
    },
  },
};

export const CamposIndex = () => {
  const prefersReducedMotion = useReducedMotion();
  const { data: fields, isLoading, isError, refetch } = useSemanticFields();

  return (
    <FieldLayout pageTitle="Campos Semánticos">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 py-12">
          <motion.h1
            className="text-5xl font-bold font-display mb-4 text-primary"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            Campos Semánticos
          </motion.h1>
          <motion.p
            className="text-text-muted mb-8 max-w-2xl leading-relaxed"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
          >
            Explora los campos semánticos del diccionario Misak. Cada campo representa un ámbito del
            conocimiento ancestral de nuestra comunidad.
          </motion.p>

          <SearchBox />

          {isLoading && <DataLoading label="Cargando campos semánticos…" />}
          {isError && <DataError onRetry={() => refetch()} />}

          {fields && (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={prefersReducedMotion ? {} : containerVariants}
              initial="hidden"
              animate="visible"
            >
              {fields.map((field) => {
                const config = getSemanticFieldConfig(field.id);
                const isAvailable = field.subfields.length > 0;
                return (
                  <motion.div
                    key={field.id}
                    variants={prefersReducedMotion ? {} : cardVariants}
                    layout
                  >
                    <Link
                      to={isAvailable ? `/campos/${field.id}` : '#'}
                      className={`group relative block p-6 rounded-2xl border backdrop-blur-md transition-all duration-300 ${
                        isAvailable
                          ? 'bg-background-dark/55 border-primary/30 hover:border-primary hover:bg-background-dark/75 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10 cursor-pointer'
                          : 'bg-background-dark/30 border-primary/10 cursor-not-allowed opacity-60'
                      }`}
                      aria-disabled={!isAvailable}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 group-hover:scale-105 transition-all duration-300">
                          <SemanticFieldIcon
                            iconKey={config?.iconKey ?? 'house'}
                            className="text-primary"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h2 className="text-xl font-bold font-display text-white mb-1 group-hover:text-primary transition-colors duration-300">
                            {field.name}
                          </h2>
                          <p className="text-sm text-primary italic mb-3">{field.nameSpanish}</p>
                          <p className="text-sm text-text-muted leading-relaxed line-clamp-2">
                            {field.shortDescription}
                          </p>
                          {isAvailable ? (
                            <span className="inline-flex items-center gap-1 mt-4 text-xs text-primary group-hover:gap-2 transition-all duration-300">
                              Explorar →
                            </span>
                          ) : (
                            <span className="inline-block mt-4 text-xs px-3 py-1.5 rounded-full bg-secondary/20 text-text-muted border border-secondary/30">
                              Próximamente
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </div>
    </FieldLayout>
  );
};
