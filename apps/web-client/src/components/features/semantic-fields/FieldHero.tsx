/**
 * @module FieldHero
 * @description Reusable hero section component for semantic field pages.
 *              Extracts the common pattern shared by CampoPage, SubfieldPage,
 *              and MicrofieldPage with customizable gradient, icon, and content.
 * @sprint Phase 2 PR #3
 */

import { SemanticFieldIcon } from '@components/features/semantic-fields/SemanticFieldIcon';
import { cn } from '@utils/cn';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { SemanticFieldIconKey } from '@/types/semanticField';

// ========== TYPES ==========

interface FieldHeroProps {
  /** Main title (displayed in h1) */
  title: string;
  /** Subtitle text displayed in italic (e.g., nameSpanish or nameMisak) */
  subtitle?: string;
  /** Long description paragraph */
  description?: string;
  /** Bilingual description in Namtrik (Spec 005) */
  descriptionMisak?: string;
  /** Tailwind gradient direction class without 'from-' prefix (e.g., 'primary/5' or 'secondary/10') */
  gradientFrom?: string;
  /** Icon key to display alongside the title */
  iconKey?: SemanticFieldIconKey;
  /** Back navigation link configuration */
  backLink: { label: string; href: string };
  /** Optional status badge */
  badge?: { text: string; variant: 'available' | 'coming-soon' };
  /** Children rendered after the back link (e.g., FieldBreadcrumb) */
  children?: React.ReactNode;
}

// ========== COMPONENT ==========

/**
 * FieldHero provides a consistent header section for field, subfield, and microfield pages.
 * Features gradient background, back navigation, icon, title, subtitle, description, and badge.
 *
 * @example
 * ```tsx
 * <FieldHero
 *   title="Territorio"
 *   subtitle="Namui Nu Pirɵ"
 *   description="El territorio Misak y sus elementos."
 *   gradientFrom="primary/5"
 *   iconKey="territory"
 *   backLink={{ label: 'Volver a Campos', href: '/campos' }}
 *   badge={{ text: 'Campo disponible', variant: 'available' }}
 * />
 * ```
 */
export const FieldHero = ({
  title,
  subtitle,
  description,
  descriptionMisak,
  gradientFrom = 'primary/5',
  iconKey,
  backLink,
  badge,
  children,
}: FieldHeroProps) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="relative">
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-b',
          gradientFrom && `from-${gradientFrom}`,
          'via-transparent to-transparent pointer-events-none',
        )}
      />
      <div className="container mx-auto px-4 pt-8 pb-16">
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {children}

          <Link
            to={backLink.href}
            className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary mb-8 transition-colors duration-300"
          >
            <span className="text-lg">←</span>
            <span>{backLink.label}</span>
          </Link>
        </motion.div>

        <motion.header
          className="max-w-3xl"
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 mb-6">
            {iconKey && (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
                <SemanticFieldIcon
                  iconKey={iconKey}
                  className="text-primary w-8 h-8 sm:w-10 sm:h-10"
                />
              </div>
            )}
            <div>
              <h1
                className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display mb-2 text-white"
                tabIndex={-1}
              >
                {title}
              </h1>
              {subtitle && <p className="text-lg sm:text-xl text-primary italic">{subtitle}</p>}
            </div>
          </div>

          {descriptionMisak && (
            <p className="text-white/90 text-base sm:text-lg leading-relaxed max-w-2xl font-serif italic mb-3">
              {descriptionMisak}
            </p>
          )}

          {description && (
            <p className="text-text-muted text-base sm:text-lg leading-relaxed max-w-2xl mb-8">
              {description}
            </p>
          )}

          {badge && (
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'w-3 h-3 rounded-full animate-pulse',
                  badge.variant === 'available' ? 'bg-primary' : 'bg-secondary',
                )}
              />
              <span className="text-sm text-text-muted">{badge.text}</span>
            </div>
          )}
        </motion.header>
      </div>
    </div>
  );
};
