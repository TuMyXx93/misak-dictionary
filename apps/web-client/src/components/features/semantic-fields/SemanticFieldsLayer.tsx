import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEMANTIC_FIELDS } from '@/constants/semanticFields';
import { getFieldBySlug } from '@/data/semanticFields';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { SemanticFieldSummary } from '@/types/semanticField';
import { SemanticFieldButton } from './SemanticFieldButton';
import { SemanticFieldModal } from './SemanticFieldModal';

export const SemanticFieldsLayer = () => {
  const [activeField, setActiveField] = useState<SemanticFieldSummary | null>(null);
  const [triggerId, setTriggerId] = useState<string | null>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const navigate = useNavigate();
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const handleClick = (field: SemanticFieldSummary) => {
    const fullField = getFieldBySlug(field.id);
    if (fullField?.status === 'available') {
      navigate(`/campos/${field.id}`);
    } else {
      setTriggerId(field.id);
      setActiveField(field);
    }
  };

  const handleClose = () => {
    setActiveField(null);
  };

  const triggerRef = triggerId ? { current: buttonRefs.current[triggerId] ?? null } : undefined;

  return (
    <>
      <div
        className={
          isDesktop
            ? 'absolute inset-0 z-20 pointer-events-none pb-[env(safe-area-inset-bottom)]'
            : 'relative z-20 w-full max-w-lg mx-auto flex flex-wrap justify-center gap-2 px-4 py-4 pointer-events-auto'
        }
      >
        {SEMANTIC_FIELDS.map((field, index) => (
          <SemanticFieldButton
            key={field.id}
            field={field}
            index={index}
            onClick={() => handleClick(field)}
            isMobile={!isDesktop}
          />
        ))}
      </div>

      <SemanticFieldModal field={activeField} onClose={handleClose} triggerRef={triggerRef} />
    </>
  );
};
