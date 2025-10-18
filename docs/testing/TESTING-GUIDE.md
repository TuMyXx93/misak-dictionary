# 🧪 Guía de Testing - Diccionario Misak

## Resumen

El proyecto incluye una suite completa de tests usando **Vitest** y **React Testing Library**.

### Estadísticas

- **112 tests** en 12 archivos
- **Tiempo de ejecución**: ~10 segundos (suite completa)
- **Cobertura objetivo**: 70% (líneas, funciones, branches, statements)

---

## 📋 Tipos de Tests

### 1. Unit Tests (Utilidades)

- `src/utils/cn.test.ts` - Testing de utilidad de clases CSS

### 2. Component Tests

- `src/components/ui/*.test.tsx` - Componentes UI básicos
- `src/components/features/*.test.tsx` - Componentes con lógica
- `src/components/layouts/*.test.tsx` - Layouts
- `src/components/sections/*.test.tsx` - Secciones de página

### 3. Integration Tests

- `src/pages/*.test.tsx` - Testing de páginas completas

---

## 🚀 Ejecutar Tests

### Comandos Básicos

```bash
# Ejecutar todos los tests una vez (recomendado para CI)
pnpm test

# Watch mode - re-ejecuta al guardar cambios
pnpm --filter web-client vitest

# UI Mode - interfaz gráfica en navegador
pnpm test:ui

# Coverage - genera reporte de cobertura
pnpm test:coverage
```

### Comandos Avanzados

```bash
# Ejecutar solo un archivo específico
pnpm --filter web-client vitest src/components/ui/Button.test.tsx

# Ejecutar tests que coincidan con un patrón
pnpm --filter web-client vitest Button

# Ejecutar con reporter verbose
pnpm --filter web-client vitest --reporter=verbose

# Modo debug
pnpm --filter web-client vitest --inspect-brk
```

---

## 📝 Escribir Tests

### Estructura de Test Básico

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);

    const element = screen.getByText('Expected Text');
    expect(element).toBeInTheDocument();
  });
});
```

### Testing con User Interactions

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button interactions', () => {
  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Mocking de Hooks

```typescript
import { vi } from 'vitest';

// Mock de hook personalizado
vi.mock('@/hooks/useLazyImage', () => ({
  useLazyImage: vi.fn(() => ({
    imageSrc: 'mocked-image.jpg',
    isLoaded: true,
    imgRef: { current: null },
  })),
}));
```

---

## 🎯 Mejores Prácticas

### 1. **Usar selectores por rol/accesibilidad**

✅ **Correcto**:

```typescript
screen.getByRole('button', { name: /submit/i });
screen.getByLabelText('Email');
screen.getByText(/welcome/i);
```

❌ **Evitar**:

```typescript
container.querySelector('.btn-submit'); // Depende de implementación
```

### 2. **Testing de comportamiento, no implementación**

✅ **Correcto**: Testear lo que el usuario ve/hace

```typescript
it('shows error message when form is invalid', async () => {
  render(<LoginForm />);

  const submitButton = screen.getByRole('button', { name: /submit/i });
  await user.click(submitButton);

  expect(screen.getByText(/email is required/i)).toBeInTheDocument();
});
```

❌ **Evitar**: Testear detalles de implementación

```typescript
it('sets error state to true', () => {
  const { result } = renderHook(() => useForm());
  expect(result.current.error).toBe(true); // Implementación interna
});
```

### 3. **Cleanup automático**

El setup ya incluye cleanup automático después de cada test:

```typescript
// src/test/setup.ts
afterEach(() => {
  cleanup();
});
```

### 4. **Mocks globales disponibles**

Ya configurados en `src/test/setup.ts`:

- `IntersectionObserver`
- `ResizeObserver`
- `jest-dom` matchers

---

## 🔧 Configuración

### vitest.config.ts

```typescript
{
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',

    // Optimización de performance
    pool: 'forks',
    maxConcurrency: 5,
    testTimeout: 10000,

    // Coverage
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
}
```

### Configuración Personalizada por Equipo

Si tu máquina tiene más o menos cores, ajusta `maxForks` en `vitest.config.ts`:

```typescript
poolOptions: {
  forks: {
    maxForks: Math.max(1, Math.floor(os.cpus().length / 2)), // Mitad de cores
  },
},
```

---

## 🐛 Troubleshooting

### Tests lentos

**Síntoma**: Tests tardan más de 15 segundos.

**Solución**:

```bash
# Verificar que usas pnpm (no npm)
pnpm test

# Reducir concurrencia en vitest.config.ts
maxConcurrency: 3  # En lugar de 5
```

### Memory Leaks

**Síntoma**: Uso de memoria crece continuamente en watch mode.

**Solución**:

```bash
# Reiniciar watch mode cada cierto tiempo
# O ajustar poolOptions.forks.maxForks a un valor menor
```

### Warnings de "empty string src"

**Síntoma**: Warnings sobre `src=""` en imágenes durante tests.

**Explicación**: Los componentes `LazyImage` usan lazy loading. En tests, las imágenes no se cargan realmente. Los warnings son normales y no afectan los tests.

**Solución**: Agregar mock si los warnings molestan:

```typescript
// En el archivo de test
vi.mock('@/components/ui/LazyImage', () => ({
  LazyImage: ({ alt, className }: any) => (
    <img src="mocked-image.jpg" alt={alt} className={className} />
  ),
}));
```

---

## 📊 Coverage

### Generar Reporte

```bash
# Generar reporte de coverage
pnpm test:coverage

# Ver reporte HTML
open apps/web-client/coverage/index.html
```

### Umbrales de Coverage

El proyecto exige mínimo 70% de cobertura en:

- Líneas de código
- Funciones
- Branches (ramas)
- Statements

### Exclusiones de Coverage

No se miden en coverage:

- `src/main.tsx` (entry point)
- `src/test/` (configuración de tests)
- Archivos `index.ts` (solo exports)
- Archivos `.config.*`
- `node_modules/`

---

## 🎓 Recursos

### Documentación Oficial

- [Vitest](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)

### Guías Internas

- [Ejemplos de tests](../../apps/web-client/src/components/ui/Button.test.tsx)
- [Setup de tests](../../apps/web-client/src/test/setup.ts)

---

## 🔄 Workflow Recomendado

### Durante Desarrollo

```bash
# Terminal 1: Watch mode de tests
pnpm --filter web-client vitest

# Terminal 2: Dev server
pnpm dev:web
```

### Antes de Commit

```bash
# Ejecutar suite completa
pnpm test

# Verificar coverage
pnpm test:coverage

# Lint y format
pnpm lint
pnpm format:check
```

### En CI/CD

```bash
# Ejecutar en modo CI (sin watch, con coverage)
pnpm test:coverage --run

# Verificar umbrales
# (falla si coverage < 70%)
```

---

**Última actualización**: 2025-10-10  
**Versión de Vitest**: 3.2.4  
**Total de Tests**: 112
