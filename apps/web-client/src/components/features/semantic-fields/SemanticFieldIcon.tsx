import type { SemanticFieldIconKey } from '@/types/semanticField';

interface SemanticFieldIconProps {
  iconKey: SemanticFieldIconKey;
  className?: string;
}

const icons: Record<SemanticFieldIconKey, React.ReactNode> = {
  house: (
    <svg
      role="img"
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <path d="M3 10.5L12 3L21 10.5" />
      <path d="M5 10V20" />
      <path d="M19 10V20" />
      <path d="M9 20V15H15V20" />
    </svg>
  ),
  garden: (
    <svg
      role="img"
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <path d="M12 16V6" />
      <path d="M12 6C12 6 8 4 8 2" />
      <path d="M12 6C12 6 16 4 16 2" />
      <path d="M12 10C12 10 9 8 7 9" />
      <path d="M12 10C12 10 15 8 17 9" />
      <path d="M4 20H20" />
      <path d="M6 16H18" />
      <path d="M6 16V20" />
      <path d="M18 16V20" />
    </svg>
  ),
  wildlife: (
    <svg
      role="img"
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <path d="M3 18C5 16 7 12 9 12C11 12 11 16 13 16C15 16 17 8 21 6" />
      <path d="M18 4L21 6L19 9" />
      <path d="M4 20L8 20" />
    </svg>
  ),
  flora: (
    <svg
      role="img"
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <path d="M12 22V8" />
      <path d="M12 8C12 8 7 6 5 3C8 3 11 5 12 8Z" />
      <path d="M12 8C12 8 17 6 19 3C16 3 13 5 12 8Z" />
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
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <path d="M2 20L8 12L12 16L16 10L22 18" />
      <path d="M16 10V6" />
      <path d="M10 18L12 16L14 18" />
      <path d="M6 20C6 17 8 16 12 16C16 16 18 17 18 20" />
    </svg>
  ),
  cosmos: (
    <svg
      role="img"
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <circle cx="12" cy="12" r="3" />
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
      strokeWidth="1.5"
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
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  ),
};

export const SemanticFieldIcon = ({ iconKey, className }: SemanticFieldIconProps) => {
  return <span className={className}>{icons[iconKey]}</span>;
};
