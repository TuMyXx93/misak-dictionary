import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSemanticFieldConfig, SEMANTIC_FIELDS } from '@/constants/semanticFields';
import { useHomeSlots } from '@/hooks/useDictionary';
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
  const { data: homeSlots } = useHomeSlots();

  // Construir los ítems a partir de home_slots de la BD o fallback a SEMANTIC_FIELDS
  const items =
    homeSlots && homeSlots.length > 0
      ? homeSlots.map((slot) => {
          const config = getSemanticFieldConfig(slot.clave);
          const summary: SemanticFieldSummary = {
            id: slot.clave,
            name: slot.etiqueta,
            nameSpanish: slot.campo?.espanolTermino ?? config?.nameSpanish ?? '',
            shortDescription: slot.campo?.espanolDescripcion ?? config?.shortDescription ?? '',
            iconKey: config?.iconKey ?? 'house',
            position: config?.position ?? { x: 50, y: 50 },
            drift: config?.drift ?? { amplitudeX: 5, amplitudeY: 5, duration: 10, delay: 0 },
          };
          return {
            key: slot.clave,
            field: summary,
            targetSlug: slot.campo?.slug ?? null,
          };
        })
      : SEMANTIC_FIELDS.map((field) => ({
          key: field.id,
          field,
          targetSlug: field.id === 'ya' ? 'ya' : null,
        }));

  const handleClick = (item: {
    key: string;
    field: SemanticFieldSummary;
    targetSlug: string | null;
  }) => {
    if (item.targetSlug) {
      navigate(`/campos/${item.targetSlug}`);
    } else {
      setTriggerId(item.key);
      setActiveField(item.field);
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
        {items.map(({ key, field, targetSlug }, index) => (
          <SemanticFieldButton
            key={key}
            field={field}
            index={index}
            onClick={() => handleClick({ key, field, targetSlug })}
            isMobile={!isDesktop}
          />
        ))}
      </div>

      <SemanticFieldModal field={activeField} onClose={handleClose} triggerRef={triggerRef} />
    </>
  );
};
