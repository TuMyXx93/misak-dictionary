import type { SemanticFieldIconKey } from '@/types/semanticField';

interface SemanticFieldIconProps {
  iconKey: SemanticFieldIconKey;
  className?: string;
}

const icons: Record<SemanticFieldIconKey, React.ReactNode> = {
  /**
   * Ya — La Casa Tradicional y el Fogón Sagrado (Nakchak)
   * Techo cónico a dos aguas con cumbrera cruzada, muros firmes y las tres tulpas del fogón con la llama viva.
   */
  house: (
    <svg
      role="img"
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      {/* Cumbrera cruzada tradicional y techo */}
      <path d="M2 11.5L12 3.5L22 11.5" />
      <path d="M10.5 2.5L13.5 5" />
      <path d="M13.5 2.5L10.5 5" />
      {/* Muros laterales */}
      <path d="M4.5 10.5V20.5H19.5V10.5" />
      {/* Nakchak: las tres piedras del fogón en la base */}
      <circle cx="9.5" cy="18.5" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="18.5" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="12" cy="15.5" r="1.25" fill="currentColor" stroke="none" />
      {/* Llama/espiral sutil de la palabra sobre el fogón */}
      <path d="M12 13.5C12 12.5 13 11.5 12 10" strokeWidth="1.35" />
    </svg>
  ),

  /**
   * Ya Tul — La Huerta Tradicional Cercana
   * Surco curvo fértil junto a la casa, brote central vigoroso con hojas simétricas y fruto/semilla de sustento.
   */
  garden: (
    <svg
      role="img"
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      {/* Surco base de tierra cultivada */}
      <path d="M3 19.5C6 18 10 18.5 12 19C14 19.5 18 20 21 18.5" />
      <path d="M4 21.5H20" strokeWidth="1.2" strokeOpacity="0.65" />
      {/* Tallo central */}
      <path d="M12 19V7" />
      {/* Hoja izquierda orgánica */}
      <path
        d="M12 13C9 13 7.5 10.5 8 8C10.5 8 12 10.5 12 13Z"
        fill="currentColor"
        fillOpacity="0.12"
      />
      {/* Hoja derecha orgánica */}
      <path
        d="M12 11C15 11 16.5 8.5 16 6C13.5 6 12 8.5 12 11Z"
        fill="currentColor"
        fillOpacity="0.12"
      />
      {/* Brote / fruto superior */}
      <circle cx="12" cy="5.25" r="1.5" fill="currentColor" />
    </svg>
  ),

  /**
   * Tra Tul — La Huerta Lejana / Labranza de Montaña
   * Cumbres andinas del Nupirau, terrazas/surcos de labranza en ladera y sol naciente en el horizonte.
   */
  'mountain-farm': (
    <svg
      role="img"
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      {/* Sol naciente sobre la cordillera */}
      <circle cx="12" cy="6.5" r="2.5" fill="currentColor" fillOpacity="0.2" />
      <path d="M12 2.5V3.5" strokeWidth="1.4" />
      <path d="M16 4L15.2 4.8" strokeWidth="1.4" />
      <path d="M8 4L8.8 4.8" strokeWidth="1.4" />
      {/* Cumbres de la cordillera andina */}
      <path d="M1.5 18L7.5 9.5L13 16L17 11L22.5 18" />
      {/* Terrazas y surcos de cultivo en ladera */}
      <path d="M4 19.5C8 18 16 18 20 19.5" strokeWidth="1.4" />
      <path d="M6.5 16.5C10 15.5 15 15.5 18.5 16.5" strokeWidth="1.2" />
    </svg>
  ),

  /**
   * Kau Ushamera — Los Animales Originarios del Páramo y Monte
   * Silueta noble de fauna andina originaria (venado/fauna del páramo) en trazo territorial estilizado.
   */
  wildlife: (
    <svg
      role="img"
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      {/* Cabeza y cornamenta/orejas erguidas de fauna andina */}
      <path d="M18.5 3.5L16 6.5M16 3.5L17.5 6.5" strokeWidth="1.4" />
      <path d="M14.5 9C15.5 7.5 17.5 7 19 8C19 9.5 17.5 10.5 16 11L14 12" />
      {/* Cuello, lomo y cuerpo en movimiento */}
      <path d="M14 12C12 11 9.5 11 7 12.5C5 13.7 4 16 4 18.5" />
      {/* Pecho y patas delanteras */}
      <path d="M14 12V17.5L12 21" />
      {/* Patas traseras y base */}
      <path d="M7 14.5L6 21" />
      <path d="M10 17L11.5 21" strokeWidth="1.3" />
      {/* Huella ancestral sutil */}
      <circle cx="19" cy="18" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="17.5" cy="15.5" r="0.75" fill="currentColor" stroke="none" />
      <circle cx="20.5" cy="15.5" r="0.75" fill="currentColor" stroke="none" />
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
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      {/* Núcleo central del saber */}
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
      {/* Órbita interior segmentada */}
      <circle cx="12" cy="12" r="6" strokeWidth="1.3" strokeDasharray="2 3" />
      {/* Nodos de la constelación de campos semánticos */}
      <circle cx="12" cy="3.5" r="1.5" fill="currentColor" />
      <circle cx="19.5" cy="7.5" r="1.5" fill="currentColor" />
      <circle cx="19.5" cy="16.5" r="1.5" fill="currentColor" />
      <circle cx="12" cy="20.5" r="1.5" fill="currentColor" />
      <circle cx="4.5" cy="16.5" r="1.5" fill="currentColor" />
      <circle cx="4.5" cy="7.5" r="1.5" fill="currentColor" />
      {/* Radios conectores */}
      <path
        d="M12 6V9.5M12 14.5V18M7 9.5L9.5 11M14.5 13L17 14.5M7 14.5L9.5 13M14.5 11L17 9.5"
        strokeWidth="1.2"
        strokeOpacity="0.8"
      />
    </svg>
  ),

  flora: (
    <svg
      role="img"
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <path d="M12 21.5V8" />
      <path d="M12 8C12 8 7 6 5 3C8 3 11 5 12 8Z" fill="currentColor" fillOpacity="0.15" />
      <path d="M12 8C12 8 17 6 19 3C16 3 13 5 12 8Z" fill="currentColor" fillOpacity="0.15" />
      <path d="M12 14C12 14 9 12 6 12C8 14 10 14 12 14Z" />
      <path d="M12 14C12 14 15 12 18 12C16 14 14 14 12 14Z" />
    </svg>
  ),

  territory: (
    <svg
      role="img"
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
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
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <circle cx="12" cy="12" r="3.5" fill="currentColor" fillOpacity="0.2" />
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
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <path d="M12 2L12 8" />
      <path d="M12 16L12 22" />
      <path d="M2 12L8 12" />
      <path d="M16 12L22 12" />
      <path d="M4.93 4.93L8.46 8.46" />
      <path d="M15.54 15.54L19.07 19.07" />
      <path d="M4.93 19.07L8.46 15.54" />
      <path d="M15.54 8.46L19.07 4.93" />
      <circle cx="12" cy="12" r="2.25" fill="currentColor" />
    </svg>
  ),
};

export const SemanticFieldIcon = ({ iconKey, className }: SemanticFieldIconProps) => {
  return <span className={className}>{icons[iconKey]}</span>;
};
