/**
 * @module FieldLayout
 * @description Shared layout wrapper for semantic field pages.
 *              Provides skip link, focus management, route transition animations,
 *              and live region for accessibility.
 * @sprint Phase 2 PR #3
 */

import { useRouteFocus } from '@hooks/useRouteFocus';
import { cn } from '@utils/cn';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

// ========== TYPES ==========

interface FieldLayoutProps {
  /** Page title used for live region announcement */
  pageTitle: string;
  /** Child components to render in the main content area */
  children: React.ReactNode;
}

// ========== COMPONENT ==========

/**
 * FieldLayout wraps semantic field pages with accessibility features:
 * - Skip link to main content
 * - Focus management moving focus to h1 on route change
 * - Fade animation on route transitions
 * - Live region announcing page changes
 *
 * @example
 * ```tsx
 * <FieldLayout pageTitle="Territorio">
 *   <h1>Territorio</h1>
 *   <p>Content here...</p>
 * </FieldLayout>
 * ```
 */
export const FieldLayout = ({ pageTitle, children }: FieldLayoutProps) => {
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [visible, setVisible] = useState(true);

  // Initialize focus management hook
  useRouteFocus();

  // Handle route transitions
  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      // Fade out
      setVisible(false);
      const timeout = setTimeout(() => {
        setDisplayLocation(location);
        setVisible(true);
      }, 150);
      return () => clearTimeout(timeout);
    }
  }, [location, displayLocation.pathname]);

  return (
    <>
      {/* Skip link for keyboard navigation */}
      <a
        href="#main-content"
        className={cn(
          'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50',
          'focus:px-4 focus:py-2 focus:rounded-lg focus:bg-primary focus:text-background',
          'focus:font-medium focus:shadow-lg',
        )}
      >
        Saltar a contenido principal
      </a>

      {/* Live region announces route changes to screen readers */}
      <output aria-live="polite" aria-atomic="true" className="sr-only">
        {pageTitle} — Misak Dictionary
      </output>

      {/* Animated main content */}
      <main id="main-content" className="min-h-dvh bg-background text-white">
        <AnimatePresence mode="wait">
          <motion.div
            key={displayLocation.pathname}
            initial={prefersReducedMotion ? {} : { opacity: 0 }}
            animate={{ opacity: visible ? 1 : 0 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.15,
              ease: 'easeOut',
            }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </>
  );
};
