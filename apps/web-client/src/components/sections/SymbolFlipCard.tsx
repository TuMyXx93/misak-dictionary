import { motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { LazyImage } from '@/components/ui/LazyImage';
import { MisakBandStripe } from '@/components/ui/MisakBandStripe';
import type { SymbolCardDetails } from '@/constants/assets';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { cn } from '@/utils/cn';

export interface GallerySymbolItem {
  readonly id: number;
  readonly webpUrl?: string;
  readonly url: string;
  readonly alt: string;
  readonly title: string;
  readonly subtitle: string;
  readonly containEmblem: boolean;
  readonly details?: SymbolCardDetails;
}

export interface SymbolFlipCardProps {
  item: GallerySymbolItem;
  index: number;
}

/**
 * Tarjeta interactiva 3D para los Símbolos del Pueblo Misak.
 *
 * Aplica:
 * - Volteo 3D (rotateY 180deg) con acento magenta (#E52D6D) al posar el cursor o interactuar
 * - Lectura progresiva automática mediante useAutoScroll (con pausa manual WCAG 2.2 SC 2.2.2)
 * - Soporte multimodal: hover de ratón, navegación por teclado (Enter, Space, Escape) y toque táctil
 * - Respeto estricto a prefers-reduced-motion (crossfade en lugar de rotación 3D, sin auto-scroll forzado)
 * - Tap targets >= 48px para controles de interacción (Constitución C3.2)
 */
export function SymbolFlipCard({ item, index }: SymbolFlipCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const [isFlipped, setIsFlipped] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasDetails = Boolean(item.details);

  const { scrollRef, isPausedByUser, pause, resume } = useAutoScroll<HTMLDivElement>({
    isActive: isFlipped && hasDetails,
    disabled: Boolean(shouldReduceMotion),
  });

  const clearHoverTimeout = useCallback(() => {
    if (hoverTimeoutRef.current !== null) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  }, []);

  const handlePointerEnter = useCallback(
    (e: React.PointerEvent) => {
      if (!hasDetails) return;
      // Solo disparar por hover si es puntero fino (ratón)
      if (e.pointerType === 'mouse') {
        clearHoverTimeout();
        hoverTimeoutRef.current = setTimeout(() => {
          setIsFlipped(true);
        }, 120);
      }
    },
    [hasDetails, clearHoverTimeout],
  );

  const handlePointerLeave = useCallback(
    (e: React.PointerEvent) => {
      if (!hasDetails) return;
      if (e.pointerType === 'mouse') {
        clearHoverTimeout();
        hoverTimeoutRef.current = setTimeout(() => {
          setIsFlipped(false);
        }, 150);
      }
    },
    [hasDetails, clearHoverTimeout],
  );

  const toggleFlip = useCallback(() => {
    if (!hasDetails) return;
    clearHoverTimeout();
    setIsFlipped((prev) => !prev);
  }, [hasDetails, clearHoverTimeout]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!hasDetails) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleFlip();
      } else if (e.key === 'Escape' && isFlipped) {
        e.preventDefault();
        clearHoverTimeout();
        setIsFlipped(false);
      }
    },
    [hasDetails, isFlipped, toggleFlip, clearHoverTimeout],
  );

  useEffect(() => {
    return () => {
      clearHoverTimeout();
    };
  }, [clearHoverTimeout]);

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: index * 0.15 }}
      viewport={{ once: true }}
      tabIndex={hasDetails ? 0 : undefined}
      role={hasDetails ? 'button' : undefined}
      aria-label={
        hasDetails
          ? `${item.title}. Presiona Enter para ${isFlipped ? 'cerrar' : 'conocer su significado'}.`
          : item.title
      }
      aria-expanded={hasDetails ? isFlipped : undefined}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onKeyDown={handleKeyDown}
      onClick={hasDetails ? toggleFlip : undefined}
      className={cn(
        'group relative overflow-hidden rounded-2xl bg-background-dark/90 shadow-xl flex flex-col transition-all duration-300',
        hasDetails
          ? 'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E52D6D]'
          : '',
        isFlipped
          ? 'border border-[#E52D6D] shadow-[0_0_28px_rgba(229,45,109,0.28)] ring-1 ring-[#E52D6D]/40'
          : 'border border-[#0055AA]/45 hover:border-[#E52D6D]/70',
      )}
    >
      <MisakBandStripe className="h-1 shrink-0" />

      {/* Contenedor con perspectiva 3D */}
      <div
        className="relative aspect-square w-full overflow-hidden"
        style={{ perspective: shouldReduceMotion ? undefined : 1200 }}
      >
        <motion.div
          animate={shouldReduceMotion ? { opacity: 1 } : { rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: shouldReduceMotion ? 0.25 : 0.48, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformStyle: shouldReduceMotion ? undefined : 'preserve-3d' }}
          className="relative w-full h-full"
        >
          {/* CARA FRONTAL: Imagen y emblema */}
          <div
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              background: item.containEmblem
                ? 'radial-gradient(circle at 50% 45%, rgba(0, 85, 170, 0.28) 0%, rgba(229, 45, 109, 0.10) 48%, rgba(7, 9, 13, 0.96) 100%)'
                : undefined,
            }}
            aria-hidden={isFlipped}
            className={cn(
              'absolute inset-0 w-full h-full flex items-center justify-center',
              isFlipped && shouldReduceMotion ? 'pointer-events-none opacity-0' : 'opacity-100',
            )}
          >
            {item.containEmblem ? (
              <picture className="w-full h-full p-6 sm:p-8 flex items-center justify-center">
                {item.webpUrl && <source srcSet={item.webpUrl} type="image/webp" />}
                <img
                  src={item.url}
                  alt={item.alt}
                  loading="lazy"
                  decoding="async"
                  width={512}
                  height={512}
                  className="max-w-full max-h-full w-auto h-auto object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-105"
                />
              </picture>
            ) : (
              <LazyImage
                alt={item.alt}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                src={item.url}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            )}

            {/* Píldora discreta indicando interactividad en tarjetas con details */}
            {hasDetails && (
              <div
                aria-hidden="true"
                className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/75 border border-[#E52D6D]/60 text-xs font-display font-medium text-white/90 backdrop-blur-sm shadow-md flex items-center gap-1.5 opacity-90 group-hover:opacity-100 group-hover:border-[#E52D6D] group-hover:scale-105 transition-all"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#E52D6D] animate-pulse" />
                <span>Ver significado</span>
              </div>
            )}
          </div>

          {/* CARA TRASERA: Significado cultural y lectura progresiva */}
          {hasDetails && item.details && (
            <div
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: shouldReduceMotion ? undefined : 'rotateY(180deg)',
              }}
              aria-hidden={!isFlipped}
              inert={!isFlipped}
              className={cn(
                'absolute inset-0 w-full h-full flex flex-col bg-[#07090d] text-start p-4 sm:p-5 select-text overflow-hidden',
                !isFlipped ? 'pointer-events-none' : '',
                !isFlipped && shouldReduceMotion ? 'opacity-0' : 'opacity-100',
              )}
              onClick={(e) => {
                // Evitar que el clic en el texto o controles voltee la tarjeta involuntariamente
                e.stopPropagation();
              }}
            >
              {/* Encabezado del reverso con control de estado */}
              <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-white/10 shrink-0">
                <span className="text-xs font-display font-semibold uppercase tracking-wider text-[#E52D6D] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#E52D6D]" />
                  Significado cultural
                </span>

                <div className="flex items-center gap-1">
                  {/* Botón Pausa / Reanudar lectura */}
                  <button
                    type="button"
                    onClick={() => {
                      if (isPausedByUser) {
                        resume();
                      } else {
                        pause();
                      }
                    }}
                    title={
                      isPausedByUser ? 'Reanudar lectura automática' : 'Pausar lectura automática'
                    }
                    aria-label={
                      isPausedByUser ? 'Reanudar lectura automática' : 'Pausar lectura automática'
                    }
                    className="min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] p-2 text-gray-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center"
                  >
                    {isPausedByUser ? (
                      <svg aria-hidden="true" className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    ) : (
                      <svg aria-hidden="true" className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <rect x="6" y="4" width="4" height="16" />
                        <rect x="14" y="4" width="4" height="16" />
                      </svg>
                    )}
                  </button>

                  {/* Botón Volver a la imagen */}
                  <button
                    type="button"
                    onClick={() => setIsFlipped(false)}
                    title="Volver al emblema"
                    aria-label="Volver al emblema"
                    className="min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] p-2 text-gray-300 hover:text-[#E52D6D] rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center font-bold"
                  >
                    <svg
                      aria-hidden="true"
                      className="w-4 h-4 stroke-current stroke-2 fill-none"
                      viewBox="0 0 24 24"
                    >
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Máscara de desvanecimiento superior */}
              <div
                aria-hidden="true"
                className="absolute left-0 right-0 top-[52px] h-4 bg-gradient-to-b from-[#07090d] to-transparent pointer-events-none z-10"
              />

              {/* Contenedor desplazable de lectura con auto-scroll */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto pr-1 text-gray-200 text-xs sm:text-sm leading-relaxed scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent focus:outline-none"
              >
                <p className="font-medium text-white mb-2.5 leading-snug">{item.details.intro}</p>

                <ol className="space-y-2 mb-3 list-none pl-0">
                  {item.details.items.map((text, idx) => (
                    <li
                      key={`${item.title}-${text.slice(0, 24)}`}
                      className="flex items-start gap-2 text-gray-300"
                    >
                      <span className="shrink-0 w-4 h-4 rounded-full bg-[#E52D6D]/20 text-[#E52D6D] border border-[#E52D6D]/50 flex items-center justify-center text-[10px] font-bold mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="flex-1">{text}</span>
                    </li>
                  ))}
                </ol>

                <p className="text-[11px] sm:text-xs text-gray-300/90 italic border-t border-white/10 pt-2.5 mt-2.5 leading-relaxed bg-white/[0.02] p-2 rounded-lg">
                  {item.details.outro}
                </p>
              </div>

              {/* Máscara de desvanecimiento inferior y pie de estado */}
              <div
                aria-hidden="true"
                className="absolute left-0 right-0 bottom-0 h-4 bg-gradient-to-t from-[#07090d] to-transparent pointer-events-none z-10"
              />
            </div>
          )}
        </motion.div>
      </div>

      {/* Pie editorial inferior exterior */}
      <div className="p-4 sm:p-5 border-t border-white/10 bg-black/80 text-center flex-1 flex flex-col justify-center">
        <p className="text-white text-xl font-display font-bold">{item.title}</p>
      </div>
    </motion.article>
  );
}
