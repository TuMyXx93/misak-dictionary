import { useRef, useState } from 'react';
import { SEMANTIC_FIELDS } from '@/constants/semanticFields';
import type { SemanticFieldSummary } from '@/types/semanticField';
import { SemanticFieldButton } from './SemanticFieldButton';
import { SemanticFieldModal } from './SemanticFieldModal';

export const SemanticFieldsLayer = () => {
  const [activeField, setActiveField] = useState<SemanticFieldSummary | null>(null);
  const [triggerId, setTriggerId] = useState<string | null>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const handleOpen = (field: SemanticFieldSummary) => {
    setTriggerId(field.id);
    setActiveField(field);
  };

  const handleClose = () => {
    setActiveField(null);
  };

  const triggerRef = triggerId ? { current: buttonRefs.current[triggerId] ?? null } : undefined;

  return (
    <>
      <div className="absolute inset-y-1/2 inset-x-0 z-20 pb-[env(safe-area-inset-bottom)]">
        {SEMANTIC_FIELDS.map((field, index) => (
          <SemanticFieldButton
            key={field.id}
            field={field}
            index={index}
            onClick={() => handleOpen(field)}
          />
        ))}
      </div>

      <SemanticFieldModal field={activeField} onClose={handleClose} triggerRef={triggerRef} />
    </>
  );
};
