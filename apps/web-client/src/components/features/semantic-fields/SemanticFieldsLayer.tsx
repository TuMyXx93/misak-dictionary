import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSemanticFieldConfig, SEMANTIC_FIELDS } from '@/constants/semanticFields';
import { useHomeSlots } from '@/hooks/useDictionary';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { SemanticFieldSummary } from '@/types/semanticField';
import { SemanticFieldButton } from './SemanticFieldButton';
import { SemanticFieldModal } from './SemanticFieldModal';

type ConstellationProfile = 'standard' | 'portrait-compact' | 'landscape-compact';

const PORTRAIT_COMPACT_POSITIONS: ReadonlyArray<{ x: number; y: number }> = [
  { x: 22, y: 28 }, // 0: Ya
  { x: 24, y: 80 }, // 1: Ya tul
  { x: 32, y: 54 }, // 2: Tra tul
  { x: 50, y: 22 }, // 3: Kau ushamera
  { x: 68, y: 56 }, // 4: Namui Nu Pirɵ
  { x: 76, y: 82 }, // 5: Namui Nu Isuik
  { x: 80, y: 32 }, // 6: Srɵ Wammera
];

const LANDSCAPE_COMPACT_POSITIONS: ReadonlyArray<{ x: number; y: number }> = [
  { x: 14, y: 34 }, // 0: Ya
  { x: 26, y: 72 }, // 1: Ya tul
  { x: 38, y: 36 }, // 2: Tra tul
  { x: 50, y: 68 }, // 3: Kau ushamera
  { x: 62, y: 34 }, // 4: Namui Nu Pirɵ
  { x: 74, y: 72 }, // 5: Namui Nu Isuik
  { x: 86, y: 38 }, // 6: Srɵ Wammera
];

const STANDARD_STAGE_POSITIONS: ReadonlyArray<{ x: number; y: number }> = [
  { x: 20, y: 42 }, // 0: Ya
  { x: 28, y: 80 }, // 1: Ya tul
  { x: 36, y: 62 }, // 2: Tra tul
  { x: 50, y: 46 }, // 3: Kau ushamera
  { x: 60, y: 66 }, // 4: Namui Nu Pirɵ
  { x: 72, y: 82 }, // 5: Namui Nu Isuik
  { x: 82, y: 52 }, // 6: Srɵ Wammera
];

const resolveStagePosition = (
  index: number,
  fallbackPosition: { x: number; y: number },
  profile: ConstellationProfile,
): { x: number; y: number } => {
  if (profile === 'landscape-compact') {
    return LANDSCAPE_COMPACT_POSITIONS[index] ?? fallbackPosition;
  }
  if (profile === 'portrait-compact') {
    return PORTRAIT_COMPACT_POSITIONS[index] ?? fallbackPosition;
  }
  return STANDARD_STAGE_POSITIONS[index] ?? fallbackPosition;
};

export const SemanticFieldsLayer = () => {
  const [activeField, setActiveField] = useState<SemanticFieldSummary | null>(null);
  const [triggerId, setTriggerId] = useState<string | null>(null);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const navigate = useNavigate();

  // Perfiles de constelación interactiva bidimensional (preserva interactividad en todos los viewports)
  const isLandscapeCompact = useMediaQuery('(max-height: 539px)');
  const isPortraitCompact = useMediaQuery('(max-width: 639px) and (min-height: 540px)');

  const profile: ConstellationProfile = isLandscapeCompact
    ? 'landscape-compact'
    : isPortraitCompact
      ? 'portrait-compact'
      : 'standard';

  const { data: homeSlots } = useHomeSlots();

  // Construir los ítems a partir de home_slots de la BD o fallback a SEMANTIC_FIELDS
  const items =
    homeSlots && homeSlots.length > 0
      ? homeSlots.map((slot, index) => {
          const config = getSemanticFieldConfig(slot.clave);
          const basePosition = config?.position ?? { x: 50, y: 50 };
          const summary: SemanticFieldSummary = {
            id: slot.clave,
            name: slot.etiqueta,
            nameSpanish: slot.campo?.espanolTermino ?? config?.nameSpanish ?? '',
            shortDescription: slot.campo?.espanolDescripcion ?? config?.shortDescription ?? '',
            iconKey: config?.iconKey ?? 'house',
            position: resolveStagePosition(index, basePosition, profile),
            drift: config?.drift ?? { amplitudeX: 5, amplitudeY: 5, duration: 10, delay: 0 },
          };
          return {
            key: slot.clave,
            field: summary,
            targetSlug: slot.campo?.slug ?? null,
          };
        })
      : SEMANTIC_FIELDS.map((field, index) => ({
          key: field.id,
          field: {
            ...field,
            position: resolveStagePosition(index, field.position, profile),
          },
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
        data-constellation-profile={profile}
        className="relative z-20 flex-1 w-full max-w-6xl mx-auto min-h-0 pointer-events-none"
      >
        {items.map(({ key, field, targetSlug }, index) => (
          <SemanticFieldButton
            key={key}
            field={field}
            index={index}
            onClick={() => handleClick({ key, field, targetSlug })}
            layoutMode="spatial"
            onExpand={() => setExpandedKey(key)}
            forceCollapsed={expandedKey !== null && expandedKey !== key}
          />
        ))}
      </div>

      <SemanticFieldModal field={activeField} onClose={handleClose} triggerRef={triggerRef} />
    </>
  );
};
