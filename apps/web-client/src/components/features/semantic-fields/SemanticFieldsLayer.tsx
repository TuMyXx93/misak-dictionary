import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSemanticFieldConfig, SEMANTIC_FIELDS } from '@/constants/semanticFields';
import { useHomeSlots } from '@/hooks/useDictionary';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { SemanticFieldSummary } from '@/types/semanticField';
import { SemanticFieldButton, type SemanticFieldLayoutMode } from './SemanticFieldButton';
import { SemanticFieldModal } from './SemanticFieldModal';

export const SemanticFieldsLayer = () => {
  const [activeField, setActiveField] = useState<SemanticFieldSummary | null>(null);
  const [triggerId, setTriggerId] = useState<string | null>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const navigate = useNavigate();

  // Matriz responsiva bidimensional (ancho × alto)
  // El modo espacial ("constelación") solo se activa cuando hay suficiente espacio en ambas dimensiones
  const isSpatial = useMediaQuery('(min-width: 1024px) and (min-height: 640px)');
  const isLandscapeCompact = useMediaQuery('(max-height: 539px)');
  const isTablet = useMediaQuery(
    '(min-width: 640px) and (max-width: 1023px) and (min-height: 540px)',
  );

  const layoutMode: SemanticFieldLayoutMode = isSpatial
    ? 'spatial'
    : isLandscapeCompact
      ? 'grid-landscape-compact'
      : isTablet
        ? 'grid-tablet'
        : 'grid-mobile';

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

  const containerClasses = {
    spatial: 'absolute inset-0 z-20 pointer-events-none pb-[env(safe-area-inset-bottom)]',
    'grid-landscape-compact':
      'relative z-20 w-full max-w-4xl mx-auto grid grid-cols-3 sm:grid-cols-4 gap-2 px-3 py-1 pointer-events-auto',
    'grid-tablet':
      'relative z-20 w-full max-w-2xl mx-auto grid grid-cols-2 gap-3.5 px-6 py-3 pointer-events-auto',
    'grid-mobile':
      'relative z-20 w-full max-w-md mx-auto grid grid-cols-1 xs:grid-cols-2 gap-2.5 px-4 py-2 pointer-events-auto',
  }[layoutMode];

  return (
    <>
      <div className={containerClasses}>
        {items.map(({ key, field, targetSlug }, index) => (
          <SemanticFieldButton
            key={key}
            field={field}
            index={index}
            onClick={() => handleClick({ key, field, targetSlug })}
            layoutMode={layoutMode}
            isMobile={!isSpatial}
          />
        ))}
      </div>

      <SemanticFieldModal field={activeField} onClose={handleClose} triggerRef={triggerRef} />
    </>
  );
};
