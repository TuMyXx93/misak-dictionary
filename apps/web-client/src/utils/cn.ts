/**
 * Utility function to merge CSS classes
 * Simple implementation - will be enhanced with clsx and tailwind-merge
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
