import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef } from 'react';
import { MisakBandStripe } from '@/components/ui/MisakBandStripe';
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/80"
        >
          <motion.div
            ref={modalContentRef}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            className={cn(
              'w-full max-w-md rounded-2xl border border-[#0055AA]/50 overflow-hidden',
              'bg-background-dark shadow-2xl',
            )}
          >
            <MisakBandStripe className="h-1.5" />
            <div className="p-6 flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0055AA]/20 border border-[#0055AA]/50">
                <SemanticFieldIcon iconKey={field.iconKey} className="h-8 w-8 text-primary-light" />
              </div>

              <h2 id="modal-title" className="mb-1 text-2xl font-bold text-white font-display">
                {field.name}
              </h2>

              <p className="mb-4 text-sm italic text-secondary-light">{field.nameSpanish}</p>

              <p className="mb-6 text-gray-300 leading-relaxed">{field.shortDescription}</p>

              <button
                type="button"
                ref={dismissRef}
                onClick={onClose}
                className={cn(
                  'w-full min-h-[44px] rounded-xl px-4 py-3 text-sm font-semibold cursor-pointer',
                  'border border-[#E52D6D]/60 bg-[#E52D6D]/20 text-white',
                  'hover:bg-[#E52D6D] focus:outline-none',
                  'focus-visible:ring-2 focus-visible:ring-primary transition-colors',
                )}
              >
                Cerrar
              </button>

              <button
                type="button"
                disabled
                className={cn(
                  'mt-3 w-full min-h-[44px] rounded-xl px-4 py-3 text-sm font-semibold',
                  'bg-[#0055AA]/20 text-gray-400 cursor-not-allowed',
                  'border border-[#0055AA]/35',
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
