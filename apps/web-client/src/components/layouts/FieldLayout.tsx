/**
 * @module FieldLayout
 * @description Shared layout wrapper for semantic field pages.
 *              Provides PublicHeader, skip link, focus management, route transition
 *              animations, and live region for accessibility.
 */

import { useRouteFocus } from '@hooks/useRouteFocus';
import { cn } from '@utils/cn';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { PublicHeader } from './PublicHeader';

interface FieldLayoutProps {
  /** Page title used for live region announcement */
  pageTitle: string;
  /** Child components to render in the main content area */
  children: React.ReactNode;
}

export const FieldLayout = ({ pageTitle, children }: FieldLayoutProps) => {
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [visible, setVisible] = useState(true);

  useRouteFocus();

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setVisible(false);
      const timeout = setTimeout(() => {
        setDisplayLocation(location);
        setVisible(true);
      }, 150);
      return () => clearTimeout(timeout);
    }
  }, [location, displayLocation.pathname]);

  return (
    <div className="misak-public-scope min-h-dvh bg-background text-white flex flex-col">
      {/* Skip link for keyboard navigation */}
      <a
        href="#main-content"
        className={cn(
          'sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50',
          'focus:px-4 focus:py-2 focus:rounded-xl focus:bg-primary focus:text-white',
          'focus:font-semibold focus:shadow-lg',
        )}
      >
        Saltar a contenido principal
      </a>

      {/* Live region announces route changes to screen readers */}
      <output aria-live="polite" aria-atomic="true" className="sr-only">
        {pageTitle} — Misak Dictionary
      </output>

      {/* Cabecera pública mobile-first */}
      <PublicHeader mainTargetId="main-content" variant="sticky" />

      {/* Animated main content */}
      <main id="main-content" className="flex-1 min-h-[calc(100dvh-4rem)] bg-background text-white">
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
    </div>
  );
};
