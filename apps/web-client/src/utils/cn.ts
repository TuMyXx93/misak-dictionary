import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge CSS classes with Tailwind conflict resolution
 *
 * Combines clsx for conditional classes and tailwind-merge for deduplication
 *
 * @example
 * ```tsx
 * cn('px-2', 'px-4') // => 'px-4' (tailwind-merge resolves conflict)
 * cn('base', condition && 'active') // => 'base active' or 'base'
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
