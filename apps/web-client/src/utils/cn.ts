import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

const customTwMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': ['text-fluid-hero', 'text-fluid-h1', 'text-fluid-h2'],
    },
  },
});

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
  return customTwMerge(clsx(inputs));
}
