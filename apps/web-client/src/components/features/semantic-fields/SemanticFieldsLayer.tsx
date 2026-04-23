import { useState } from 'react';
import { SEMANTIC_FIELDS } from '@/constants/semanticFields';
import type { SemanticFieldSummary } from '@/types/semanticField';
import { SemanticFieldButton } from './SemanticFieldButton';
import { SemanticFieldModal } from './SemanticFieldModal';

export const SemanticFieldsLayer = () => {
  const [activeField, setActiveField] = useState<SemanticFieldSummary | null>(null);

  return (
    <>
      <div className="absolute inset-0 z-20">
        {SEMANTIC_FIELDS.map((field) => (
          <SemanticFieldButton key={field.id} field={field} onClick={() => setActiveField(field)} />
        ))}
      </div>

      <SemanticFieldModal field={activeField} onClose={() => setActiveField(null)} />
    </>
  );
};
