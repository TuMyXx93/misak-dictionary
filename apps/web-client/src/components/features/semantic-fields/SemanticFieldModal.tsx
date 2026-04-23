import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef } from 'react';
import type { SemanticFieldSummary } from '@/types/semanticField';
import { cn } from '@/utils/cn';
import { SemanticFieldIcon } from './SemanticFieldIcon';

interface SemanticFieldModalProps {
  field: SemanticFieldSummary | null;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export const SemanticFieldModal = ({ field, onClose, triggerRef }: SemanticFieldModalProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const dismissRef = useRef<HTMLButtonElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (field && dismissRef.current) {
      dismissRef.current.focus();
    }
  }, [field]);

  const handleFocusTrap = useCallback((e: KeyboardEvent) => {
    if (e.key !== 'Tab' || !modalContentRef.current) return;

    const focusables = modalContentRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    if (focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && field) {
        onClose();
        return;
      }
      if (field) {
        handleFocusTrap(e);
      }
    };

    if (field) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      if (field && triggerRef?.current) {
        triggerRef.current.focus();
      }
    };
  }, [field, onClose, handleFocusTrap, triggerRef]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {field && (
        <motion.div
          ref={overlayRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleOverlayClick}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-background/70"
        >
          <motion.div
            ref={modalContentRef}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            className={cn(
              'w-full max-w-md rounded-2xl border border-primary/20',
              'bg-background-light p-6 shadow-2xl',
            )}
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <SemanticFieldIcon iconKey={field.iconKey} className="h-8 w-8 text-primary" />
              </div>

              <h2 id="modal-title" className="mb-2 text-2xl font-bold text-white font-display">
                {field.name}
              </h2>

              <p className="mb-4 text-sm italic text-primary">{field.nameSpanish}</p>

              <p className="mb-6 text-text-muted leading-relaxed">{field.shortDescription}</p>

              <button
                type="button"
                ref={dismissRef}
                onClick={onClose}
                className={cn(
                  'w-full rounded-lg px-4 py-3 text-sm font-semibold',
                  'border border-primary/30 text-white',
                  'hover:bg-primary/10 focus:outline-none',
                  'focus-visible:ring-2 focus-visible:ring-primary',
                )}
              >
                Cerrar
              </button>

              <button
                type="button"
                disabled
                className={cn(
                  'mt-3 w-full rounded-lg px-4 py-3 text-sm font-semibold',
                  'bg-secondary/50 text-text-disabled cursor-not-allowed',
                  'border border-secondary/30',
                )}
              >
                Explorar este campo — próximamente
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
