/**
 * @module FieldHero
 * @description Cabecera editorial mobile-first para CampoPage, SubfieldPage y MicrofieldPage.
 *              Integra los 4 colores Misak (#E52D6D, #0055AA, #FFFFFF, #000000), deduplicación
 *              bilingüe, migas de pan unificadas (sin doble enlace de retorno) y soporte
 *              multimedia de sección (audio, imagen, video y futuros formatos).
 */

import { SemanticFieldIcon } from '@components/features/semantic-fields/SemanticFieldIcon';
import { cn } from '@utils/cn';
import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { SectionMediaShowcase } from '@/components/media/CulturalResourceRegistry';
import {
  type CulturalMediaSummary,
  resolveBilingualTitle,
  type SemanticFieldIconKey,
} from '@/types/semanticField';

interface FieldHeroProps {
  /** Main title (displayed in h1) */
  title: string;
  /** Subtitle text displayed in italic (automatically deduplicated if equal to title) */
  subtitle?: string;
  /** Long description paragraph */
  description?: string;
  /** Bilingual description in Namtrik (Spec 005) */
  descriptionMisak?: string;
  /** Optional accent tone */
  gradientFrom?: string;
  /** Icon key to display alongside the title */
  iconKey?: SemanticFieldIconKey;
  /** Back navigation link configuration (used when children breadcrumb is not provided) */
  backLink?: { label: string; href: string };
  /** Optional status badge */
  badge?: { text: string; variant: 'available' | 'coming-soon' };
  /** Optional section-level multimedia */
  namtrikAudio?: string | null;
  espanolAudio?: string | null;
  imagen?: string | null;
  medios?: CulturalMediaSummary[];
  /** Optional breadcrumb navigation (replaces redundant backLink when present) */
  children?: ReactNode;
}

export const FieldHero = ({
  title,
  subtitle,
  description,
  descriptionMisak,
  iconKey,
  backLink,
  badge,
  namtrikAudio,
  espanolAudio,
  imagen,
  medios,
  children,
}: FieldHeroProps) => {
  const prefersReducedMotion = useReducedMotion();
  const { title: resolvedTitle, subtitle: resolvedSubtitle } = resolveBilingualTitle(
    title,
    subtitle,
  );

  return (
    <div className="relative overflow-hidden border-b border-white/10">
      {/* Atmósfera cromática Misak: Azul Piurek (#0055AA) + Magenta (#E52D6D) sobre Negro (#000000) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 20% 0%, rgba(0, 85, 170, 0.28) 0%, rgba(229, 45, 109, 0.12) 45%, transparent 75%)',
        }}
      />

      <div className="container mx-auto px-4 pt-6 sm:pt-8 pb-10 sm:pb-12 relative z-10">
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          {children ? (
            children
          ) : backLink ? (
            <Link
              to={backLink.href}
              className="inline-flex items-center gap-2 min-h-[40px] px-3 py-1.5 rounded-xl border border-[#0055AA]/40 bg-black/55 text-sm text-secondary-light hover:text-white hover:border-[#E52D6D] mb-6 transition-colors duration-200"
            >
              <span aria-hidden="true">←</span>
              <span>{backLink.label}</span>
            </Link>
          ) : null}
        </motion.div>

        <motion.header
          className="max-w-4xl"
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05, ease: 'easeOut' }}
        >
          <div className="flex flex-row items-center gap-4 sm:gap-5 mb-5">
            {iconKey && (
              <div className="misak-hero-emblem w-[clamp(3.75rem,5.5vw+2.25rem,5.25rem)] h-[clamp(3.75rem,5.5vw+2.25rem,5.25rem)] aspect-square rounded-2xl bg-gradient-to-br from-[#0055AA]/35 via-[#081b38]/80 to-[#E52D6D]/25 flex items-center justify-center shrink-0 border border-[#0055AA]/65 shadow-[0_0_24px_rgba(0,85,170,0.28)] ring-1 ring-inset ring-white/10">
                <SemanticFieldIcon
                  iconKey={iconKey}
                  className="text-primary-light w-[70%] h-[70%]"
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1
                className="text-fluid-h1 font-bold font-display tracking-tight text-white break-words"
                tabIndex={-1}
              >
                {resolvedTitle}
              </h1>
              {resolvedSubtitle && (
                <p className="text-lg sm:text-xl text-primary-light font-sans font-medium mt-1 break-words">
                  {resolvedSubtitle}
                </p>
              )}
            </div>
          </div>

          {descriptionMisak && (
            <p className="text-white/95 text-base sm:text-lg leading-relaxed max-w-3xl font-sans font-medium mb-2.5">
              {descriptionMisak}
            </p>
          )}

          {description && (
            <p className="text-gray-300 text-base sm:text-lg leading-relaxed max-w-3xl mb-4">
              {description}
            </p>
          )}

          <SectionMediaShowcase
            title={resolvedTitle}
            namtrikAudio={namtrikAudio}
            espanolAudio={espanolAudio}
            imagen={imagen}
            medios={medios}
          />

          {badge && (
            <div className="mt-5 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/15 bg-black/60">
              <span
                className={cn(
                  'w-2.5 h-2.5 rounded-full',
                  badge.variant === 'available' ? 'bg-[#E52D6D]' : 'bg-[#0055AA]',
                )}
              />
              <span className="text-xs font-medium text-gray-200">{badge.text}</span>
            </div>
          )}
        </motion.header>
      </div>
    </div>
  );
};
