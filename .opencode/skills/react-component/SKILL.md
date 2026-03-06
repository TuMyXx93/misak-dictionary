---
name: react-component
description: >
  Patron completo para crear componentes React 19 siguiendo las convenciones del proyecto
  Misak Dictionary. Incluye estructura de archivo, props interface, JSDoc, barrel export,
  TailwindCSS, y archivo de test colocado. Usar cuando se necesite crear un nuevo componente.
---

# Skill: React Component

Patron para generar componentes React completos que respeten las convenciones del proyecto.

## Estructura de Archivo del Componente

````tsx
/**
 * @module NombreComponente
 * @description Descripcion del proposito del componente.
 * @sprint Sprint X — Nombre del sprint
 */

import type { ReactNode } from 'react';

import { cn } from '@utils/cn';

// ========== TYPES ==========

interface NombreComponenteProps {
  /** Descripcion de la prop */
  propRequerida: string;
  /** Descripcion de la prop opcional */
  propOpcional?: boolean;
  /** Contenido hijo del componente */
  children?: ReactNode;
}

// ========== COMPONENT ==========

/**
 * Descripcion breve del componente.
 *
 * @example
 * ```tsx
 * <NombreComponente propRequerida="valor">
 *   Contenido
 * </NombreComponente>
 * ```
 */
export const NombreComponente = ({
  propRequerida,
  propOpcional = false,
  children,
}: NombreComponenteProps) => {
  return <div className={cn('clase-base', propOpcional && 'clase-condicional')}>{children}</div>;
};
````

## Para UI Primitives (Button, Input, etc.)

Usar `forwardRef` y setear `displayName`:

```tsx
import { forwardRef } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Variante visual del boton */
  variant?: 'primary' | 'secondary' | 'ghost';
  /** Tamano del boton */
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'rounded font-medium transition-colors',
          variant === 'primary' && 'bg-primary text-white',
          variant === 'secondary' && 'bg-secondary text-gray-900',
          variant === 'ghost' && 'bg-transparent hover:bg-gray-100',
          size === 'sm' && 'px-3 py-1.5 text-sm',
          size === 'md' && 'px-4 py-2 text-base',
          size === 'lg' && 'px-6 py-3 text-lg',
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
```

## Barrel Export

Si el componente esta en su propio directorio, crear `index.ts`:

```ts
export { NombreComponente } from './NombreComponente';
export type { NombreComponenteProps } from './NombreComponente';
```

## Archivo de Test Colocado

Crear `NombreComponente.test.tsx` junto al componente:

```tsx
/**
 * @module NombreComponente.test
 * @description Tests unitarios para NombreComponente.
 */

import { render, screen } from '@testing-library/react';

import { NombreComponente } from './NombreComponente';

describe('NombreComponente', () => {
  it('should render correctly with required props', () => {
    // 1. Arrange
    render(<NombreComponente propRequerida="test" />);

    // 2. Act & Assert
    expect(screen.getByText('test')).toBeInTheDocument();
  });

  it('should apply conditional styles when propOpcional is true', () => {
    // 1. Arrange
    const { container } = render(<NombreComponente propRequerida="test" propOpcional />);

    // 2. Assert
    expect(container.firstChild).toHaveClass('clase-condicional');
  });

  it('should render children content', () => {
    // 1. Arrange
    render(
      <NombreComponente propRequerida="test">
        <span>Child content</span>
      </NombreComponente>,
    );

    // 2. Assert
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });
});
```

## Ubicaciones Validas

- Componentes UI reutilizables: `src/components/ui/`
- Componentes de layout: `src/components/layout/`
- Componentes de pagina: `src/pages/` o `src/components/pages/`
- Componentes de feature: `src/components/<feature>/`
- Hooks: `src/hooks/`

## Checklist

- [ ] Named export (no default export)
- [ ] Props interface con JSDoc en cada prop
- [ ] JSDoc del modulo con `@module`, `@description`, `@sprint`
- [ ] `@example` con TSX en componentes reutilizables
- [ ] `forwardRef` + `displayName` si es UI primitive
- [ ] TailwindCSS para estilos, `cn()` para clases condicionales
- [ ] Test colocado con `.test.tsx`
- [ ] Barrel export si esta en directorio propio
- [ ] `import type` para type-only imports
