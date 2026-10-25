/**
 * CamposIndex Page — Spec 003: datos reales desde la API
 *
 * Vista índice mobile-first de los campos semánticos Misak con armonía
 * cuatricolor (#E52D6D · #0055AA · #FFFFFF · #000000).
 */

import { SearchBox } from '@components/features/semantic-fields/SearchBox';
import { SemanticFieldIcon } from '@components/features/semantic-fields/SemanticFieldIcon';
import { FieldLayout } from '@components/layouts/FieldLayout';
import { DataError, DataLoading } from '@components/ui/QueryBoundary';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MisakBandStripe, MisakSelvedgeDivider } from '@/components/ui/MisakBandStripe';
import { getSemanticFieldConfig } from '@/constants/semanticFields';
import { useSemanticFields } from '@/hooks/useDictionary';
import { resolveBilingualTitle } from '@/types/semanticField';

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
} as const;

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'tween' as const,
      ease: 'easeOut' as const,
      duration: 0.35,
    },
  },
};

export const CamposIndex = () => {
  const prefersReducedMotion = useReducedMotion();
  const { data: fields, isLoading, isError, refetch } = useSemanticFields();

  return (
    <FieldLayout pageTitle="Campos Semánticos">
      <div className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 30% 0%, rgba(0, 85, 170, 0.26) 0%, rgba(229, 45, 109, 0.12) 45%, transparent 75%)',
          }}
        />
        <div className="container mx-auto px-4 py-8 sm:py-12 relative z-10">
          <div className="max-w-3xl mb-8">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#0055AA]/25 text-secondary-light border border-[#0055AA]/50 mb-3">
              Sabiduría del Territorio · Wamtɵrmarɵpik
            </span>
            <motion.h1
              className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display mb-3 text-white"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            >
              Campos Semánticos
            </motion.h1>
            <motion.p
              className="text-gray-300 leading-relaxed"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.08, ease: 'easeOut' }}
            >
              Explora los campos semánticos del diccionario Misak. Cada campo representa un ámbito
              del conocimiento ancestral de nuestra comunidad.
            </motion.p>
            <MisakSelvedgeDivider className="max-w-sm mt-5" />
          </div>

          <SearchBox />

          {isLoading && <DataLoading label="Cargando campos semánticos…" />}
          {isError && <DataError onRetry={() => refetch()} />}

          {fields && (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
              variants={prefersReducedMotion ? {} : containerVariants}
              initial="hidden"
              animate="visible"
            >
              {fields.map((field, index) => {
                const config = getSemanticFieldConfig(field.id);
                const isAvailable =
                  field.subfields.length > 0 || Boolean(field.terms && field.terms.length > 0);
                const { title, subtitle } = resolveBilingualTitle(field.name, field.nameSpanish);
                const isBlueAccent = index % 2 === 1;

                return (
                  <motion.div
                    key={field.id}
                    variants={prefersReducedMotion ? {} : cardVariants}
                    layout
                    className="h-full"
                  >
                    <Link
                      to={isAvailable ? `/campos/${field.id}` : '#'}
                      onClick={(e) => {
                        if (!isAvailable) e.preventDefault();
                      }}
                      className={`group relative h-full flex flex-col justify-between overflow-hidden rounded-2xl border backdrop-blur-md transition-all duration-250 ${
                        isAvailable
                          ? 'bg-background-dark/70 border-[#0055AA]/40 hover:border-[#E52D6D]/80 hover:bg-background-dark/95 shadow-lg cursor-pointer'
                          : 'bg-background-dark/35 border-white/10 cursor-not-allowed opacity-65'
                      }`}
                      aria-disabled={!isAvailable}
                    >
                      <MisakBandStripe className="h-1" />

                      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div
                            className={`w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 border transition-colors ${
                              isBlueAccent
                                ? 'bg-[#0055AA]/20 border-[#0055AA]/50 text-secondary-light group-hover:bg-[#0055AA]/35'
                                : 'bg-[#E52D6D]/20 border-[#E52D6D]/50 text-primary-light group-hover:bg-[#E52D6D]/35'
                            }`}
                          >
                            <SemanticFieldIcon
                              iconKey={config?.iconKey ?? 'house'}
                              className="w-6 h-6"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h2 className="text-xl font-bold font-display text-white group-hover:text-primary-light transition-colors break-words">
                              {title}
                            </h2>
                            {subtitle && (
                              <p className="text-sm text-secondary-light italic mt-0.5 break-words">
                                {subtitle}
                              </p>
                            )}
                            {field.shortDescription && (
                              <p className="text-sm text-gray-300 leading-relaxed line-clamp-3 mt-2.5">
                                {field.shortDescription}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                          {isAvailable ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-light group-hover:text-white transition-colors">
                              Explorar campo <span aria-hidden="true">→</span>
                            </span>
                          ) : (
                            <span className="inline-block text-xs px-3 py-1 rounded-full bg-[#0055AA]/20 text-secondary-light border border-[#0055AA]/40">
                              Próximamente
                            </span>
                          )}
                          <span className="text-xs text-gray-400">
                            {field.subfields.length} subcampo
                            {field.subfields.length !== 1 ? 's' : ''}
                          </span>
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
