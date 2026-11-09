import type { SemanticFieldIconKey } from '@/types/semanticField';
import { cn } from '@/utils/cn';

export interface SemanticFieldIconProps {
  iconKey: SemanticFieldIconKey;
  className?: string;
  /** Activa micro-animaciones culturales SVG (respeta prefers-reduced-motion en CSS) */
  animated?: boolean;
}

const SVG_BASE_CLASS = 'w-full h-full block overflow-visible';

const icons: Record<SemanticFieldIconKey, React.ReactNode> = {
  /**
   * Ya (C1) — La Casa Tradicional y el Fogón Sagrado (Nakchak / Nakkuk)
   * En la cosmovisión Misak, la casa es un ser vivo que encarna la figura de la mujer y madre protectora.
   * Su techo envolvente cubierto de capipaja cobija en su centro las tres tulpas del fogón (Nakkuk)
   * y la llama viva de donde nace la lengua y la memoria ancestral (Wammera).
   */
  house: (
    <svg
      role="img"
      aria-hidden="true"
      viewBox="0 0 24 24"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={SVG_BASE_CLASS}
    >
      {/* Manto protector de capipaja (vestidura materna de la casa antropomorfa) */}
      <path
        className="misak-svg-roof"
        d="M1.8 11.8C5.6 8.5 9 5 12 2.6C15 5 18.4 8.5 22.2 11.8L19.6 12.2H4.4L1.8 11.8Z"
        fill="currentColor"
        fillOpacity="0.24"
        stroke="none"
      />
      {/* Cumbrera cruzada ancestral (Ya tarau / coronilla) y faldas del techo */}
      <path d="M10 1.6L14 4.8M14 1.6L10 4.8" strokeWidth="1.55" />
      <path d="M1.6 11.8C5.8 8.4 9 5.2 12 2.6C15 5.2 18.2 8.4 22.4 11.8" />
      {/* Muros que abrazan y dan cobijo (Wallikatɵ y Yaketa) */}
      <path d="M4.4 11.2V19.8C4.4 20.5 5 21 5.7 21H18.3C19 21 19.6 20.5 19.6 19.8V11.2" />
      {/* Llama/Espiral de la palabra viva (Wammera) sobre el fogón */}
      <path
        className="misak-svg-flame"
        d="M12 15.4C10.2 13.8 10.6 11.2 12 9.6C13.4 11.2 13.8 13.8 12 15.4Z"
        fill="currentColor"
        fillOpacity="0.38"
        strokeWidth="1.45"
      />
      {/* Nakkuk: Las tres tulpas sagradas del fogón */}
      <circle
        className="misak-svg-ember-1"
        cx="9"
        cy="18.5"
        r="1.45"
        fill="currentColor"
        stroke="none"
      />
      <circle
        className="misak-svg-ember-2"
        cx="15"
        cy="18.5"
        r="1.45"
        fill="currentColor"
        stroke="none"
      />
      <circle
        className="misak-svg-ember-3"
        cx="12"
        cy="17"
        r="1.35"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  ),

  /**
   * Ya Tul (C2) — La Huerta Tradicional Cercana (Yatul)
   * Cultivos de pan coger y plantas medicinales (Mɵ tsilɵmera) junto al hogar.
   * Representa el 'matrimonio de la planta' (fecundación y polinización natural mediante viento,
   * lluvia e insectos) en el surco fértil de la huerta familiar.
   */
  garden: (
    <svg
      role="img"
      aria-hidden="true"
      viewBox="0 0 24 24"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={SVG_BASE_CLASS}
    >
      {/* Tierra fértil de la huerta cercana (Ya pulu mɵn tul) */}
      <path
        d="M2.2 19C6 16.8 18 16.8 21.8 19C18 21.6 6 21.6 2.2 19Z"
        fill="currentColor"
        fillOpacity="0.24"
        stroke="none"
      />
      <path d="M2 18.8C6 16.8 18 16.8 22 18.8" />
      <path d="M5 21.2C9.2 19.8 14.8 19.8 19 21.2" strokeWidth="1.4" strokeOpacity="0.85" />
      {/* Tallo central vigoroso */}
      <path d="M12 17.4V6.8" />
      {/* Hojas de pan coger y plantas medicinales (Mɵ tsilɵmera) */}
      <path
        className="misak-svg-leaf-l"
        d="M12 14.4C7.8 14.4 4.8 11.4 5.6 7.5C9.6 7.5 12 10.5 12 14.4Z"
        fill="currentColor"
        fillOpacity="0.25"
      />
      <path
        className="misak-svg-leaf-r"
        d="M12 12.2C16.2 12.2 19.2 9.2 18.4 5.3C14.4 5.3 12 8.3 12 12.2Z"
        fill="currentColor"
        fillOpacity="0.25"
      />
      {/* Floración, semilla y matrimonio de la planta con polinización (C2.S2) */}
      <circle
        className="misak-svg-pollen-c"
        cx="12"
        cy="4.2"
        r="1.9"
        fill="currentColor"
        stroke="none"
      />
      <circle
        className="misak-svg-pollen-1"
        cx="8"
        cy="4.5"
        r="1.05"
        fill="currentColor"
        fillOpacity="0.8"
        stroke="none"
      />
      <circle
        className="misak-svg-pollen-2"
        cx="16"
        cy="3.4"
        r="1.05"
        fill="currentColor"
        fillOpacity="0.8"
        stroke="none"
      />
    </svg>
  ),

  /**
   * Tra Tul (C3) — La Huerta Lejana / Labranza de Montaña
   * Espacio de trabajo a gran distancia (lamɵtɵ) para cultivo intensivo en laderas andinas.
   * Cumbres montañosas limpias con tres surcos en perspectiva descendente bajo el horizonte.
   */
  'mountain-farm': (
    <svg
      role="img"
      aria-hidden="true"
      viewBox="0 0 24 24"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={SVG_BASE_CLASS}
    >
      {/* Sol de altura en el horizonte andino */}
      <circle
        className="misak-svg-sun"
        cx="17.8"
        cy="5.2"
        r="2.4"
        fill="currentColor"
        fillOpacity="0.28"
        strokeWidth="1.45"
      />
      {/* Cordillera andina lejana con volumen duotono sin colisionar con los surcos */}
      <path
        d="M1.5 15.2L8 5.8L13.6 13L17.4 8.4L22.5 15.2Z"
        fill="currentColor"
        fillOpacity="0.22"
        stroke="none"
      />
      <path d="M1.5 15.2L8 5.8L13.6 13" />
      <path d="M11.8 10.9L17.2 7.8L22.5 15.2" />
      {/* Ladera de labranza intensiva y tres surcos en perspectiva */}
      <path d="M1.5 15.2C8.5 14 15.5 14 22.5 15.2" strokeWidth="1.55" />
      <path className="misak-svg-furrow-1" d="M3.2 21C5.4 18 7.5 16 9.6 14.5" strokeWidth="1.55" />
      <path
        className="misak-svg-furrow-2"
        d="M10.4 21.4C11.4 18.4 12.2 16.2 13 14.5"
        strokeWidth="1.55"
      />
      <path
        className="misak-svg-furrow-3"
        d="M17.8 21C17 18.2 16.1 16.2 15.2 14.7"
        strokeWidth="1.55"
      />
    </svg>
  ),

  /**
   * Kau Ushamera (C4) — Los Animales Originarios del Páramo, Cielo y Agua
   * Articula los 3 reinos de la fauna silvestre Misak:
   * Illimera (aves en vuelo - C4.S1), Pirau amɵñip (venado de páramo - C4.S2) y Piu (aguas - C4.S3).
   */
  wildlife: (
    <svg
      role="img"
      aria-hidden="true"
      viewBox="0 0 24 24"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={SVG_BASE_CLASS}
    >
      {/* Illimera (Las aves - C4.S1): Ave andina en vuelo superior */}
      <path
        className="misak-svg-bird"
        d="M2 6.2C4.2 4.5 6.1 5 7.2 6.7C8.3 5 10.2 4.5 12.4 6.2"
        strokeWidth="1.65"
      />
      {/* Pirau amɵñip (Fauna silvestre de páramo - C4.S2): Venado andino estilizado en perfil noble */}
      <path d="M14.6 8C14.6 5.8 16 3.8 17.8 2.5M14.6 5.8L12.4 4" strokeWidth="1.55" />
      <path
        className="misak-svg-deer"
        d="M9.2 18.5C9.6 14 11.8 10.8 14.6 8.4L20.2 9.5C20.2 11.7 18.2 12.8 16 12.8L17.1 18.5H9.2Z"
        fill="currentColor"
        fillOpacity="0.24"
        stroke="none"
      />
      <path d="M9.2 18.2C9.6 14 11.8 10.8 14.6 8.4L20.4 9.5C20.2 11.7 18.2 12.8 16 12.8L17.1 18.2" />
      {/* Piu putrap ushamera (Aguas y lagunas de páramo - C4.S3) */}
      <path
        className="misak-svg-water"
        d="M2.2 20.8C6 19.2 10.2 22.2 14 20.6C17.2 19.2 19.8 21.6 22 20.4"
        strokeWidth="1.55"
        strokeOpacity="0.9"
      />
    </svg>
  ),

  /**
   * Cosmos Grid — Botón Global de Campos Semánticos
   * Matriz territorial y espiral cósmica que articula los 7 campos del saber alrededor del núcleo Misak.
   */
  'cosmos-grid': (
    <svg
      role="img"
      aria-hidden="true"
      viewBox="0 0 24 24"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={SVG_BASE_CLASS}
    >
      {/* Núcleo central del saber */}
      <circle className="misak-svg-core" cx="12" cy="12" r="2.6" fill="currentColor" />
      {/* Órbita interior segmentada */}
      <circle
        className="misak-svg-orbit"
        cx="12"
        cy="12"
        r="6.2"
        strokeWidth="1.35"
        strokeDasharray="2 3"
      />
      {/* Nodos de la constelación de campos semánticos */}
      <circle cx="12" cy="3.2" r="1.55" fill="currentColor" />
      <circle cx="19.8" cy="7.4" r="1.55" fill="currentColor" />
      <circle cx="19.8" cy="16.6" r="1.55" fill="currentColor" />
      <circle cx="12" cy="20.8" r="1.55" fill="currentColor" />
      <circle cx="4.2" cy="16.6" r="1.55" fill="currentColor" />
      <circle cx="4.2" cy="7.4" r="1.55" fill="currentColor" />
      {/* Radios conectores */}
      <path
        d="M12 5.8V9.4M12 14.6V18.2M6.8 9.4L9.4 11M14.6 13L17.2 14.6M6.8 14.6L9.4 13M14.6 11L17.2 9.4"
        strokeWidth="1.25"
        strokeOpacity="0.82"
      />
    </svg>
  ),

  flora: (
    <svg
      role="img"
      aria-hidden="true"
      viewBox="0 0 24 24"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={SVG_BASE_CLASS}
    >
      <path d="M12 21.5V8" />
      <path
        className="misak-svg-leaf-l"
        d="M12 8C12 8 7 6 5 3C8 3 11 5 12 8Z"
        fill="currentColor"
        fillOpacity="0.2"
      />
      <path
        className="misak-svg-leaf-r"
        d="M12 8C12 8 17 6 19 3C16 3 13 5 12 8Z"
        fill="currentColor"
        fillOpacity="0.2"
      />
      <path d="M12 14C12 14 9 12 6 12C8 14 10 14 12 14Z" />
      <path d="M12 14C12 14 15 12 18 12C16 14 14 14 12 14Z" />
    </svg>
  ),

  territory: (
    <svg
      role="img"
      aria-hidden="true"
      viewBox="0 0 24 24"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={SVG_BASE_CLASS}
    >
      <path
        d="M2 19L8 11.5L12 15.5L16 9.5L22 17.5Z"
        fill="currentColor"
        fillOpacity="0.18"
        stroke="none"
      />
      <path d="M2 19L8 11.5L12 15.5L16 9.5L22 17.5" />
      <path d="M16 9.5V5.5" />
      <path d="M10 17.5L12 15.5L14 17.5" />
      <path d="M5 20C5 17 8 16 12 16C16 16 19 17 19 20" />
    </svg>
  ),

  cosmos: (
    <svg
      role="img"
      aria-hidden="true"
      viewBox="0 0 24 24"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={SVG_BASE_CLASS}
    >
      <circle
        className="misak-svg-core"
        cx="12"
        cy="12"
        r="3.8"
        fill="currentColor"
        fillOpacity="0.24"
      />
      <path d="M12 2V5" />
      <path d="M12 19V22" />
      <path d="M2 12H5" />
      <path d="M19 12H22" />
      <path d="M4.93 4.93L7.05 7.05" />
      <path d="M16.95 16.95L19.07 19.07" />
      <path d="M4.93 19.07L7.05 16.95" />
      <path d="M16.95 7.05L19.07 4.93" />
    </svg>
  ),

  neologism: (
    <svg
      role="img"
      aria-hidden="true"
      viewBox="0 0 24 24"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={SVG_BASE_CLASS}
    >
      <path d="M12 2L12 8" />
      <path d="M12 16L12 22" />
      <path d="M2 12L8 12" />
      <path d="M16 12L22 12" />
      <path d="M4.93 4.93L8.46 8.46" />
      <path d="M15.54 15.54L19.07 19.07" />
      <path d="M4.93 19.07L8.46 15.54" />
      <path d="M15.54 8.46L19.07 4.93" />
      <circle className="misak-svg-core" cx="12" cy="12" r="2.4" fill="currentColor" />
    </svg>
  ),
};

export const SemanticFieldIcon = ({
  iconKey,
  className,
  animated = true,
}: SemanticFieldIconProps) => {
  return (
    <span
      data-icon-key={iconKey}
      data-animated={animated ? 'true' : 'false'}
      className={cn(
        'misak-field-icon inline-flex items-center justify-center shrink-0 w-5 h-5',
        className,
      )}
    >
      {icons[iconKey]}
    </span>
  );
};
