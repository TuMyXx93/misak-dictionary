/**
 * DraggableSearchTrigger
 * Spec 012 (R-010) — Botón flotante reposicionable/arrastrable para el buscador global
 * - Arrastrable libremente en pantalla táctil o puntero con persistencia en localStorage.
 * - Se oculta automáticamente en `/campos` (donde el buscador semántico ya está integrado).
 * - Distingue con precisión entre arrastre (drag) y toque (tap) para abrir el modal.
 */

import { useEffect, useRef, useState } from 'react';
import { useInRouterContext, useLocation } from 'react-router-dom';
import { useGlobalSearch } from '@/contexts/GlobalSearchContext';

const STORAGE_KEY = 'misak_search_fab_pos';

interface Position {
  x: number;
  y: number;
}

interface DraggableSearchTriggerContentProps {
  pathname: string;
}

const DraggableSearchTriggerContent = ({ pathname }: DraggableSearchTriggerContentProps) => {
  const { openSearch } = useGlobalSearch();

  const [position, setPosition] = useState<Position | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    moved: boolean;
  } | null>(null);
  const fabRef = useRef<HTMLButtonElement>(null);

  // Ocultar automáticamente en /campos
  const isHiddenOnThisPage = pathname === '/campos';

  // Cargar posición guardada o colocar en esquina inferior derecha
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          // Limitar dentro de los límites de la ventana
          const maxX = window.innerWidth - 64;
          const maxY = window.innerHeight - 64;
          setPosition({
            x: Math.min(Math.max(16, parsed.x), maxX),
            y: Math.min(Math.max(16, parsed.y), maxY),
          });
          return;
        }
      }
    } catch {
      // Ignorar error de parsing
    }

    // Posición por defecto: abajo a la derecha
    setPosition({
      x: window.innerWidth - 72,
      y: window.innerHeight - 90,
    });
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!position) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
      moved: false,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging || !dragStartRef.current) return;

    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;

    if (Math.hypot(deltaX, deltaY) > 5) {
      dragStartRef.current.moved = true;
    }

    const maxX = window.innerWidth - 60;
    const maxY = window.innerHeight - 60;

    const newX = Math.min(Math.max(16, dragStartRef.current.initialX + deltaX), maxX);
    const newY = Math.min(Math.max(16, dragStartRef.current.initialY + deltaY), maxY);

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging) return;
    setIsDragging(false);

    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignorar si el puntero ya no está capturado
    }

    const wasDrag = dragStartRef.current?.moved;
    dragStartRef.current = null;

    if (wasDrag && position) {
      // Guardar posición
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
      } catch {
        // Ignorar quotaExceeded
      }
    } else if (!wasDrag) {
      // Fue un clic o tap
      openSearch();
    }
  };

  if (isHiddenOnThisPage || !position) return null;

  return (
    <button
      ref={fabRef}
      type="button"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        setIsDragging(false);
        dragStartRef.current = null;
      }}
      aria-label="Abrir buscador del diccionario (arrastrable)"
      title="Buscador global de Wamtɵrmarɵpik (puedes arrastrarme para reubicarme)"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: 'none',
      }}
      className={`fixed z-40 w-13 h-13 rounded-full flex items-center justify-center
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
      {/* Indicador sutil de arrastre */}
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
