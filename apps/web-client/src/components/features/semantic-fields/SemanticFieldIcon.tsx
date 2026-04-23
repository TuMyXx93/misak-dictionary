import type { SemanticFieldIconKey } from '@/types/semanticField';

interface SemanticFieldIconProps {
  iconKey: SemanticFieldIconKey;
  className?: string;
}

const icons: Record<SemanticFieldIconKey, React.ReactNode> = {
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
      <path d="M3 17L9 11L13 15L21 7" />
      <path d="M21 7V14" />
      <path d="M15 7V11" />
    </svg>
  ),
  home: (
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
      <path d="M3 12L5 10M5 10L12 3L19 10M5 10V20M19 10V20M9 20H15" />
    </svg>
  ),
  fire: (
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
      <path d="M12 3C12 3 8 7 8 11C8 13 9.5 15 12 15C14.5 15 16 13 16 11C16 7 12 3 12 3Z" />
      <path d="M12 15V21" />
      <path d="M8 21H16" />
    </svg>
  ),
  weave: (
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
      <path d="M4 4L12 12L20 4" />
      <path d="M4 12L12 20L20 12" />
      <path d="M4 20H20" />
    </svg>
  ),
  voice: (
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
      <path d="M12 3C8 3 5 6 5 10V14C5 18 8 21 12 21C16 21 19 18 19 14V10C19 6 16 3 12 3Z" />
      <path d="M12 7V13" />
      <circle cx="12" cy="17" r="1" fill="currentColor" />
    </svg>
  ),
};

export const SemanticFieldIcon = ({ iconKey, className }: SemanticFieldIconProps) => {
  return <span className={className}>{icons[iconKey]}</span>;
};
