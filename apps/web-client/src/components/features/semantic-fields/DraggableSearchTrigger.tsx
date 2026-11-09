/**
 * DraggableSearchTrigger
 * Spec 012 (R-010, R-021) — Botón flotante reposicionable/arrastrable para el buscador global
 * - Arrastrable libremente en pantalla táctil o puntero con persistencia en localStorage.
 * - Se oculta automáticamente en `/campos` (donde el buscador semántico ya está integrado).
 * - Distingue con precisión entre arrastre (> 6px) y toque/clic sin disparar aperturas dobles.
 * - Soporta activación accesible universal vía teclado (Enter / Space) y tecnologías asistivas
 *   (VoiceOver / TalkBack) mediante onClick protegido por bandera de arrastre.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useInRouterContext, useLocation } from 'react-router-dom';
import { useGlobalSearch } from '@/contexts/GlobalSearchContext';

const STORAGE_KEY = 'misak_search_fab_pos';
const DRAG_THRESHOLD_PX = 6;
const TOUCH_DRAG_THRESHOLD_PX = 12;
const KEYBOARD_MOVE_STEP_PX = 15;
const FAB_SIZE_PX = 52;
const SAFE_MARGIN_PX = 16;
const SAFE_BOTTOM_CLEARANCE_PX = 72;
const POST_MODAL_KEYBOARD_GUARD_MS = 450;

let sharedPreModalViewport: { width: number; height: number } | null = null;
let sharedModalClosedAt = 0;

interface Position {
  x: number;
  y: number;
}

/**
 * Ancla canónica elegida por la persona usuaria.
 * Conserva tanto las coordenadas exactas (x, y) para el viewport donde se soltó la lupa
 * como las proporciones normalizadas (xRatio, yRatio en [0..1]) para proyectar la posición
 * ante cambios de tamaño de ventana o rotación de pantalla sin destruir la ubicación original.
 */
interface FabAnchor {
  x: number;
  y: number;
  xRatio: number;
  yRatio: number;
  viewportWidth: number;
  viewportHeight: number;
}

const clamp01 = (value: number): number =>
  Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;

/**
 * Obtiene las dimensiones del layout viewport (window.innerWidth / innerHeight).
 * No utiliza visualViewport.height para evitar que la apertura/cierre del teclado virtual móvil
 * (IME) desplace o sobrescriba la coordenada Y del botón flotante.
 */
const getViewportDimensions = (): { width: number; height: number } => {
  if (typeof window === 'undefined') {
    return { width: 1024, height: 768 };
  }
  const docEl = typeof document !== 'undefined' ? document.documentElement : null;
  const width =
    window.innerWidth > 0
      ? window.innerWidth
      : docEl && docEl.clientWidth > 0
        ? docEl.clientWidth
        : 1024;
  const height =
    window.innerHeight > 0
      ? window.innerHeight
      : docEl && docEl.clientHeight > 0
        ? docEl.clientHeight
        : 768;
  return { width, height };
};

const getSafeBounds = (width: number, height: number) => {
  const safeW = Number.isFinite(width) && width > 0 ? width : 1024;
  const safeH = Number.isFinite(height) && height > 0 ? height : 768;
  const minX = SAFE_MARGIN_PX;
  const maxX = Math.max(SAFE_MARGIN_PX, Math.round(safeW - FAB_SIZE_PX - SAFE_MARGIN_PX));
  const minY = SAFE_MARGIN_PX;
  const maxY = Math.max(SAFE_MARGIN_PX, Math.round(safeH - SAFE_BOTTOM_CLEARANCE_PX));
  return { minX, maxX, minY, maxY };
};

const clampToViewport = (x: number, y: number, viewport = getViewportDimensions()): Position => {
  const { minX, maxX, minY, maxY } = getSafeBounds(viewport.width, viewport.height);
  const safeX = Number.isFinite(x) ? Math.round(x) : maxX;
  const safeY = Number.isFinite(y) ? Math.round(y) : maxY;
  return {
    x: Math.min(Math.max(minX, safeX), maxX),
    y: Math.min(Math.max(minY, safeY), maxY),
  };
};

const createAnchorFromPosition = (
  x: number,
  y: number,
  width: number,
  height: number,
): FabAnchor => {
  const { minX, maxX, minY, maxY } = getSafeBounds(width, height);
  const safeX = Number.isFinite(x) ? Math.round(x) : maxX;
  const safeY = Number.isFinite(y) ? Math.round(y) : maxY;
  const clampedX = Math.min(Math.max(minX, safeX), maxX);
  const clampedY = Math.min(Math.max(minY, safeY), maxY);
  const spanX = Math.max(1, maxX - minX);
  const spanY = Math.max(1, maxY - minY);
  return {
    x: clampedX,
    y: clampedY,
    xRatio: clamp01((clampedX - minX) / spanX),
    yRatio: clamp01((clampedY - minY) / spanY),
    viewportWidth: width,
    viewportHeight: height,
  };
};

const resolvePositionFromAnchor = (anchor: FabAnchor, width: number, height: number): Position => {
  const { minX, maxX, minY, maxY } = getSafeBounds(width, height);
  // Si el viewport coincide con aquel donde el usuario ubicó la lupa, restituir el píxel exacto
  if (
    Math.abs(width - anchor.viewportWidth) <= 2 &&
    Math.abs(height - anchor.viewportHeight) <= 2
  ) {
    return {
      x: Math.min(Math.max(minX, Math.round(anchor.x)), maxX),
      y: Math.min(Math.max(minY, Math.round(anchor.y)), maxY),
    };
  }

  // Si el viewport cambió (resize o rotación portrait <-> landscape), proyectar proporcionalmente
  const spanX = Math.max(1, maxX - minX);
  const spanY = Math.max(1, maxY - minY);
  const projectedX = minX + clamp01(anchor.xRatio) * spanX;
  const projectedY = minY + clamp01(anchor.yRatio) * spanY;
  return {
    x: Math.min(Math.max(minX, Math.round(projectedX)), maxX),
    y: Math.min(Math.max(minY, Math.round(projectedY)), maxY),
  };
};

const persistAnchorToStorage = (anchor: FabAnchor): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(anchor));
  } catch {
    // Ignorar quotaExceeded
  }
};

const readSavedAnchor = (width: number, height: number): FabAnchor | null => {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      sharedPreModalViewport = null;
      sharedModalClosedAt = 0;
      return null;
    }
    const parsed = JSON.parse(saved);
    if (!Number.isFinite(parsed?.x) || !Number.isFinite(parsed?.y)) {
      return null;
    }
    if (
      Number.isFinite(parsed.xRatio) &&
      Number.isFinite(parsed.yRatio) &&
      Number.isFinite(parsed.viewportWidth) &&
      Number.isFinite(parsed.viewportHeight) &&
      parsed.viewportWidth > 0 &&
      parsed.viewportHeight > 0
    ) {
      const { minX, maxX, minY, maxY } = getSafeBounds(parsed.viewportWidth, parsed.viewportHeight);
      return {
        x: Math.min(Math.max(minX, Math.round(parsed.x)), maxX),
        y: Math.min(Math.max(minY, Math.round(parsed.y)), maxY),
        xRatio: clamp01(parsed.xRatio),
        yRatio: clamp01(parsed.yRatio),
        viewportWidth: parsed.viewportWidth,
        viewportHeight: parsed.viewportHeight,
      };
    }
    return createAnchorFromPosition(parsed.x, parsed.y, width, height);
  } catch {
    return null;
  }
};

const getEffectiveViewport = (fallbackStable?: {
  width: number;
  height: number;
}): { width: number; height: number; isKeyboardRetracting: boolean } => {
  const { width, height } = getViewportDimensions();
  const refViewport = sharedPreModalViewport ?? fallbackStable;
  const isKeyboardRetracting =
    Boolean(refViewport) &&
    sharedModalClosedAt > 0 &&
    Date.now() - sharedModalClosedAt < POST_MODAL_KEYBOARD_GUARD_MS &&
    Math.abs(width - (refViewport?.width ?? width)) <= 2 &&
    height < (refViewport?.height ?? height);

  return {
    width,
    height: isKeyboardRetracting && refViewport ? refViewport.height : height,
    isKeyboardRetracting,
  };
};

const getInitialAnchorAndPosition = (): { anchor: FabAnchor; position: Position } => {
  const { width, height } = getEffectiveViewport();
  const savedAnchor = readSavedAnchor(width, height);
  if (savedAnchor) {
    return {
      anchor: savedAnchor,
      position: resolvePositionFromAnchor(savedAnchor, width, height),
    };
  }
  const defaultAnchor = createAnchorFromPosition(width - 72, height - 92, width, height);
  return {
    anchor: defaultAnchor,
    position: { x: defaultAnchor.x, y: defaultAnchor.y },
  };
};

interface DraggableSearchTriggerContentProps {
  pathname: string;
}

const DraggableSearchTriggerContent = ({ pathname }: DraggableSearchTriggerContentProps) => {
  const { isOpen, openSearch } = useGlobalSearch();

  const [position, setPosition] = useState<Position | null>(
    () => getInitialAnchorAndPosition().position,
  );
  const positionRef = useRef<Position | null>(position);
  const anchorRef = useRef<FabAnchor | null>(null);
  const stableViewportRef = useRef<{ width: number; height: number }>(getViewportDimensions());
  const wasOpenRef = useRef(isOpen);
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    pointerId: number;
    pointerType: string;
    moved: boolean;
  } | null>(null);
  const activeTouchRef = useRef(false);
  const justDraggedRef = useRef(false);
  const openedByPointerRef = useRef(false);
  const resetTimerRef = useRef<number | null>(null);
  const fabRef = useRef<HTMLButtonElement>(null);

  // Ocultar automáticamente en /campos o cuando el modal global ya está abierto
  const isHiddenOnThisPage = pathname === '/campos' || isOpen;

  const updateVisualPosition = useCallback((next: Position) => {
    positionRef.current = next;
    setPosition((prev) => {
      if (prev && prev.x === next.x && prev.y === next.y) return prev;
      return next;
    });
  }, []);

  /**
   * Registra una nueva posición elegida explícitamente por el usuario (arrastre o teclado)
   * actualizando el ancla canónica en memoria y en localStorage de forma inmediata.
   */
  const commitUserPosition = useCallback(
    (next: Position) => {
      const { width, height } = getViewportDimensions();
      stableViewportRef.current = { width, height };
      sharedPreModalViewport = { width, height };
      const nextAnchor = createAnchorFromPosition(next.x, next.y, width, height);
      anchorRef.current = nextAnchor;
      const resolved = { x: nextAnchor.x, y: nextAnchor.y };
      updateVisualPosition(resolved);
      persistAnchorToStorage(nextAnchor);
    },
    [updateVisualPosition],
  );

  const scheduleFlagReset = useCallback(() => {
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
    }
    resetTimerRef.current = window.setTimeout(() => {
      justDraggedRef.current = false;
      openedByPointerRef.current = false;
      resetTimerRef.current = null;
    }, 150);
  }, []);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  // Cargar posición guardada o colocar en esquina inferior derecha respetando safe-area
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const { width, height, isKeyboardRetracting } = getEffectiveViewport(stableViewportRef.current);
    if (!isKeyboardRetracting) {
      stableViewportRef.current = { width, height };
    }

    const savedAnchor = readSavedAnchor(width, height);
    if (savedAnchor) {
      anchorRef.current = savedAnchor;
      updateVisualPosition(resolvePositionFromAnchor(savedAnchor, width, height));
      return;
    }

    // Posición por defecto: abajo a la derecha con holgura sobre barras de gestos móviles
    const defaultAnchor = createAnchorFromPosition(width - 72, height - 92, width, height);
    anchorRef.current = defaultAnchor;
    updateVisualPosition({ x: defaultAnchor.x, y: defaultAnchor.y });
  }, [updateVisualPosition]);

  // Al abrir/cerrar el modal (o cambiar de sección/ruta), proteger la geometría previa al teclado
  // virtual móvil y restituir exactamente la posición desde el ancla canónica.
  useEffect(() => {
    if (!wasOpenRef.current && isOpen) {
      sharedPreModalViewport = stableViewportRef.current;
    } else if (wasOpenRef.current && !isOpen) {
      sharedModalClosedAt = Date.now();
    }
    wasOpenRef.current = isOpen;

    if (isHiddenOnThisPage) return;

    const { width, height } = getEffectiveViewport(stableViewportRef.current);
    const activeAnchor = readSavedAnchor(width, height) ?? anchorRef.current;
    if (activeAnchor) {
      anchorRef.current = activeAnchor;
      updateVisualPosition(resolvePositionFromAnchor(activeAnchor, width, height));
    }
  }, [isOpen, isHiddenOnThisPage, updateVisualPosition]);

  // Reajustar proporcionalmente o mediante clamping si cambia el tamaño o la orientación de la pantalla,
  // SIN sobrescribir el ancla canónica elegida por el usuario en localStorage.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleViewportChange = () => {
      if (isOpen) return;
      const { width, height, isKeyboardRetracting } = getEffectiveViewport(
        stableViewportRef.current,
      );

      if (!isKeyboardRetracting) {
        stableViewportRef.current = { width, height };
        sharedPreModalViewport = { width, height };
      }

      const activeAnchor = anchorRef.current ?? readSavedAnchor(width, height);
      if (!activeAnchor) return;
      anchorRef.current = activeAnchor;

      const nextPos = resolvePositionFromAnchor(activeAnchor, width, height);
      updateVisualPosition(nextPos);
    };

    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('orientationchange', handleViewportChange);
    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('orientationchange', handleViewportChange);
    };
  }, [isOpen, updateVisualPosition]);

  // Listeners táctiles nativos (touchend no pasivo) para abrir con 1 tap en cualquier coordenada
  // del viewport móvil, suprimiendo el click sintético diferido que cerraba el modal o robaba el foco.
  const hasPosition = position !== null;
  useEffect(() => {
    if (isHiddenOnThisPage || !hasPosition) return;
    const btn = fabRef.current;
    if (!btn) return;

    const handleTouchStart = (e: TouchEvent) => {
      activeTouchRef.current = true;
      const touch = e.touches[0];
      const currentPos = positionRef.current;
      if (touch && currentPos && !dragStartRef.current) {
        dragStartRef.current = {
          startX: touch.clientX,
          startY: touch.clientY,
          initialX: currentPos.x,
          initialY: currentPos.y,
          pointerId: -1,
          pointerType: 'touch',
          moved: false,
        };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const dragState = dragStartRef.current;
      const touch = e.touches[0];
      if (!dragState || !touch) return;

      const deltaX = touch.clientX - dragState.startX;
      const deltaY = touch.clientY - dragState.startY;

      if (!dragState.moved) {
        if (Math.hypot(deltaX, deltaY) <= TOUCH_DRAG_THRESHOLD_PX) {
          return;
        }
        dragState.moved = true;
      }

      const nextPos = clampToViewport(dragState.initialX + deltaX, dragState.initialY + deltaY);
      commitUserPosition(nextPos);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const wasActiveTouch = activeTouchRef.current;
      activeTouchRef.current = false;
      const wasMoved = Boolean(dragStartRef.current?.moved) || justDraggedRef.current;
      dragStartRef.current = null;

      if (wasMoved) {
        justDraggedRef.current = true;
        scheduleFlagReset();
        if (anchorRef.current) {
          persistAnchorToStorage(anchorRef.current);
        }
        if (e.cancelable) {
          e.preventDefault();
        }
        return;
      }

      if (wasActiveTouch && !openedByPointerRef.current) {
        if (e.cancelable) {
          e.preventDefault();
        }
        openedByPointerRef.current = true;
        scheduleFlagReset();
        openSearch({ viaTouch: true });
      }
    };

    const handleTouchCancel = () => {
      activeTouchRef.current = false;
      dragStartRef.current = null;
    };

    btn.addEventListener('touchstart', handleTouchStart, { passive: true });
    btn.addEventListener('touchmove', handleTouchMove, { passive: true });
    btn.addEventListener('touchend', handleTouchEnd, { passive: false });
    btn.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    return () => {
      btn.removeEventListener('touchstart', handleTouchStart);
      btn.removeEventListener('touchmove', handleTouchMove);
      btn.removeEventListener('touchend', handleTouchEnd);
      btn.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [isHiddenOnThisPage, hasPosition, openSearch, scheduleFlagReset, commitUserPosition]);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (typeof e.button === 'number' && e.button !== 0) return;
    const currentPos = positionRef.current ?? position;
    if (!currentPos) return;

    justDraggedRef.current = false;
    openedByPointerRef.current = false;

    if (e.pointerType !== 'touch') {
      try {
        e.currentTarget.setPointerCapture?.(e.pointerId);
      } catch {
        // Ignorar si el entorno sintético no soporta captura de puntero
      }
    }

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: currentPos.x,
      initialY: currentPos.y,
      pointerId: e.pointerId,
      pointerType: e.pointerType || 'mouse',
      moved: false,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const dragState = dragStartRef.current;
    if (!dragState) return;

    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - dragState.startY;
    const isTouch =
      e.pointerType === 'touch' || dragState.pointerType === 'touch' || activeTouchRef.current;
    const threshold = isTouch ? TOUCH_DRAG_THRESHOLD_PX : DRAG_THRESHOLD_PX;

    if (!dragState.moved) {
      if (Math.hypot(deltaX, deltaY) <= threshold) {
        return;
      }
      dragState.moved = true;
      try {
        e.currentTarget.setPointerCapture?.(e.pointerId);
      } catch {
        // Ignorar si el entorno sintético no soporta captura de puntero
      }
    }

    const nextPos = clampToViewport(dragState.initialX + deltaX, dragState.initialY + deltaY);
    commitUserPosition(nextPos);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const dragState = dragStartRef.current;
    if (!dragState) return;

    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    } catch {
      // Ignorar si el puntero ya no está capturado
    }

    const wasDrag = dragState.moved;
    const isTouch = e.pointerType === 'touch' || dragState.pointerType === 'touch';
    dragStartRef.current = null;

    if (wasDrag) {
      justDraggedRef.current = true;
      scheduleFlagReset();
      if (anchorRef.current) {
        persistAnchorToStorage(anchorRef.current);
      }
      return;
    }

    // Si hay un gesto táctil nativo activo (touchstart), dejar que touchend (passive: false)
    // cancele el click sintético diferido y abra el modal sincrónicamente.
    if (activeTouchRef.current) {
      return;
    }

    openedByPointerRef.current = true;
    scheduleFlagReset();
    openSearch(isTouch ? { viaTouch: true } : undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const currentPos = positionRef.current ?? position;
    if (!currentPos) return;

    let deltaX = 0;
    let deltaY = 0;
    if (e.key === 'ArrowLeft') deltaX = -KEYBOARD_MOVE_STEP_PX;
    else if (e.key === 'ArrowRight') deltaX = KEYBOARD_MOVE_STEP_PX;
    else if (e.key === 'ArrowUp') deltaY = -KEYBOARD_MOVE_STEP_PX;
    else if (e.key === 'ArrowDown') deltaY = KEYBOARD_MOVE_STEP_PX;
    else return;

    e.preventDefault();
    const nextPos = clampToViewport(currentPos.x + deltaX, currentPos.y + deltaY);
    commitUserPosition(nextPos);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (justDraggedRef.current) {
      e.preventDefault();
      justDraggedRef.current = false;
      return;
    }
    if (openedByPointerRef.current) {
      openedByPointerRef.current = false;
      return;
    }
    openSearch();
  };

  if (isHiddenOnThisPage || !position) return null;

  return (
    <button
      ref={fabRef}
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        if (dragStartRef.current?.moved && anchorRef.current) {
          justDraggedRef.current = true;
          scheduleFlagReset();
          persistAnchorToStorage(anchorRef.current);
        }
        activeTouchRef.current = false;
        dragStartRef.current = null;
      }}
      onLostPointerCapture={() => {
        if (dragStartRef.current?.moved && anchorRef.current) {
          justDraggedRef.current = true;
          scheduleFlagReset();
          persistAnchorToStorage(anchorRef.current);
        }
        dragStartRef.current = null;
      }}
      aria-label="Abrir buscador del diccionario (arrastrable con puntero o teclas de flecha)"
      title="Buscador global de Wamtɵrmarɵpik (Ctrl+K o `/` · puedes arrastrarme para reubicarme)"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
      className={`fixed z-[45] w-13 h-13 rounded-full flex items-center justify-center
        bg-black/85 hover:bg-[#0055AA] active:scale-95 text-white border-2 border-[#0055AA]/80 hover:border-[#E52D6D]
        shadow-2xl backdrop-blur-md cursor-grab active:cursor-grabbing transition-transform select-none
        focus:outline-none focus-visible:ring-4 focus-visible:ring-[#E52D6D]/50`}
    >
      <svg
        aria-hidden="true"
        className="w-6 h-6 text-secondary-light pointer-events-none drop-shadow"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        viewBox="0 0 24 24"
      >
        <circle cx="11" cy="11" r="7" />
        <path strokeLinecap="round" d="M20 20l-3.5-3.5" />
      </svg>
      <span className="sr-only">Buscador global arrastrable</span>
    </button>
  );
};

const DraggableSearchTriggerWithRouter = () => {
  const location = useLocation();
  return <DraggableSearchTriggerContent pathname={location.pathname} />;
};

export const DraggableSearchTrigger = () => {
  const inRouter = useInRouterContext();
  if (!inRouter) {
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
    return <DraggableSearchTriggerContent pathname={pathname} />;
  }
  return <DraggableSearchTriggerWithRouter />;
};
