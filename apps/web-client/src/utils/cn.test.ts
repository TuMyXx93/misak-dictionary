import { describe, expect, it } from 'vitest';
import { cn } from './cn';

describe('cn utility', () => {
  it('should merge class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle Tailwind class conflicts (last one wins)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('should handle conditional classes with falsy values', () => {
    const condition = false;
    expect(cn('base', condition && 'hidden', 'visible')).toBe('base visible');
    expect(cn('base', null, undefined, 'visible')).toBe('base visible');
  });

  it('should handle arrays of classes', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
    expect(cn(['px-2', 'py-2'], 'text-white')).toBe('px-2 py-2 text-white');
  });

  it('should handle objects with boolean values', () => {
    expect(cn({ foo: true, bar: false })).toBe('foo');
    expect(cn({ 'text-white': true, 'bg-black': false })).toBe('text-white');
  });

  it('should handle mixed inputs (strings, arrays, objects)', () => {
    expect(cn('base', ['foo', 'bar'], { baz: true, qux: false }, 'final')).toBe(
      'base foo bar baz final',
    );
  });

  it('should handle empty inputs', () => {
    expect(cn()).toBe('');
    expect(cn('', null, undefined, false)).toBe('');
  });

  it('should trim and deduplicate classes', () => {
    expect(cn('  foo  ', 'bar')).toBe('foo bar');
  });

  it('should handle complex Tailwind utilities', () => {
    // Test with actual Tailwind classes like in Button component
    expect(cn('inline-flex items-center', 'bg-primary text-background', 'px-6 py-3')).toBe(
      'inline-flex items-center bg-primary text-background px-6 py-3',
    );
  });

  it('should override conflicting responsive utilities', () => {
    expect(cn('px-2 md:px-4', 'px-6')).toBe('md:px-4 px-6');
  });

  it('should handle hover, focus, and state variants', () => {
    expect(cn('hover:bg-blue-500', 'hover:bg-red-500')).toBe('hover:bg-red-500');
  });
});
