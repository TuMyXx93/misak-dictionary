---
name: vitest-testing
description: >
  Patron para crear tests con Vitest 4 siguiendo Arrange/Act/Assert. Cubre componentes
  React con Testing Library, hooks, use cases con mocks, controllers y repositories.
  Incluye patrones de mocking y thresholds de cobertura del proyecto.
---

# Skill: Vitest Testing

Patron para generar tests completos siguiendo las convenciones de testing del proyecto
Misak Dictionary.

## Configuracion

- **Framework**: Vitest 4 con globals habilitados (no importar `describe`, `it`, `expect`)
- **Frontend**: React Testing Library + `@testing-library/jest-dom`
- **Archivos**: colocados junto al fuente con `.test.ts` / `.test.tsx`
- **Patron**: Arrange/Act/Assert
- **Cobertura minima**: Frontend 70%, Backend 80%

## Tests de Componentes React

```tsx
/**
 * @module Button.test
 * @description Tests unitarios para el componente Button.
 */

import { render, screen, fireEvent } from '@testing-library/react';

import { Button } from './Button';

describe('Button', () => {
  describe('rendering', () => {
    it('should render with default props', () => {
      // 1. Arrange & Act
      render(<Button>Click me</Button>);

      // 2. Assert
      const button = screen.getByRole('button', { name: 'Click me' });
      expect(button).toBeInTheDocument();
    });

    it('should render with primary variant by default', () => {
      // 1. Arrange
      render(<Button>Test</Button>);

      // 2. Assert
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary');
    });

    it('should render with secondary variant', () => {
      // 1. Arrange
      render(<Button variant="secondary">Test</Button>);

      // 2. Assert
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-secondary');
    });
  });

  describe('interactions', () => {
    it('should call onClick handler when clicked', () => {
      // 1. Arrange
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);

      // 2. Act
      fireEvent.click(screen.getByRole('button'));

      // 3. Assert
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', () => {
      // 1. Arrange
      const handleClick = vi.fn();
      render(
        <Button onClick={handleClick} disabled>
          Click me
        </Button>,
      );

      // 2. Act
      fireEvent.click(screen.getByRole('button'));

      // 3. Assert
      expect(handleClick).not.toHaveBeenCalled();
    });
  });
});
```

## Tests de Hooks

```tsx
/**
 * @module useCounter.test
 * @description Tests para el hook useCounter.
 */

import { renderHook, act } from '@testing-library/react';

import { useCounter } from './useCounter';

describe('useCounter', () => {
  it('should initialize with default value', () => {
    // 1. Arrange & Act
    const { result } = renderHook(() => useCounter());

    // 2. Assert
    expect(result.current.count).toBe(0);
  });

  it('should initialize with provided value', () => {
    // 1. Arrange & Act
    const { result } = renderHook(() => useCounter(10));

    // 2. Assert
    expect(result.current.count).toBe(10);
  });

  it('should increment the counter', () => {
    // 1. Arrange
    const { result } = renderHook(() => useCounter());

    // 2. Act
    act(() => {
      result.current.increment();
    });

    // 3. Assert
    expect(result.current.count).toBe(1);
  });
});
```

## Tests de Use Cases (Backend)

```ts
/**
 * @module CreateWordUseCase.test
 * @description Tests unitarios para CreateWordUseCase.
 */

import type { INombreRepository } from '../../../domain/ports/INombreRepository.js';
import { CreateWordUseCase } from './CreateWordUseCase.js';

// ========== MOCKS ==========

const mockRepository: INombreRepository = {
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

describe('CreateWordUseCase', () => {
  let useCase: CreateWordUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new CreateWordUseCase(mockRepository);
  });

  describe('execute', () => {
    it('should create a word successfully', async () => {
      // 1. Arrange
      const input = { term: 'namui', definition: 'agua', language: 'misak' as const };
      const expected = { id: '1', ...input, createdAt: new Date(), updatedAt: new Date() };
      vi.mocked(mockRepository.create).mockResolvedValue(expected);

      // 2. Act
      const result = await useCase.execute(input);

      // 3. Assert
      expect(result).toEqual(expected);
      expect(mockRepository.create).toHaveBeenCalledWith(input);
      expect(mockRepository.create).toHaveBeenCalledTimes(1);
    });

    it('should throw error when repository fails', async () => {
      // 1. Arrange
      const input = { term: 'namui', definition: 'agua', language: 'misak' as const };
      vi.mocked(mockRepository.create).mockRejectedValue(new Error('DB error'));

      // 2. Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow('DB error');
    });
  });
});
```

## Tests de Controllers (Backend)

```ts
/**
 * @module WordController.test
 * @description Tests unitarios para WordController.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';

import { WordController } from './WordController.js';

// ========== MOCKS ==========

const mockCreateUseCase = { execute: vi.fn() };

const mockRequest = (
  body: unknown = {},
  params: unknown = {},
  query: unknown = {},
): FastifyRequest => ({ body, params, query }) as unknown as FastifyRequest;

const mockReply = (): FastifyReply => {
  const reply = {
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
  return reply as unknown as FastifyReply;
};

describe('WordController', () => {
  let controller: WordController;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new WordController(mockCreateUseCase as any);
  });

  describe('create', () => {
    it('should return 201 with created word', async () => {
      // 1. Arrange
      const body = { term: 'namui', definition: 'agua', language: 'misak' };
      const created = { id: '1', ...body };
      mockCreateUseCase.execute.mockResolvedValue(created);
      const req = mockRequest(body);
      const rep = mockReply();

      // 2. Act
      await controller.create(req, rep);

      // 3. Assert
      expect(rep.status).toHaveBeenCalledWith(201);
      expect(rep.send).toHaveBeenCalledWith({
        statusCode: 201,
        message: expect.any(String),
        data: created,
      });
    });

    it('should return 400 for invalid input', async () => {
      // 1. Arrange
      const req = mockRequest({ term: '' }); // term vacio
      const rep = mockReply();

      // 2. Act
      await controller.create(req, rep);

      // 3. Assert
      expect(rep.status).toHaveBeenCalledWith(400);
    });
  });
});
```

## Patrones de Mocking

```ts
// Mockear modulo completo
vi.mock('@utils/cn', () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(' '),
}));

// Mockear funcion
const spy = vi.fn().mockReturnValue('value');
const asyncSpy = vi.fn().mockResolvedValue('value');

// Mockear timer
vi.useFakeTimers();
vi.advanceTimersByTime(1000);
vi.useRealTimers();

// Mockear fetch
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ data: 'test' }),
});

// Limpiar mocks
beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.restoreAllMocks());
```

## Comandos

```sh
# Frontend — archivo unico
pnpm --filter web-client exec vitest run src/components/ui/Button.test.tsx

# Backend — archivo unico
pnpm --filter @misak/backend-service exec vitest run src/application/use-cases/auth/LoginUseCase.test.ts

# Cobertura completa
pnpm test:coverage

# Watch mode
pnpm test
```

## Checklist

- [ ] Patron Arrange/Act/Assert en cada test
- [ ] `describe` por componente/clase, `it` por comportamiento
- [ ] Test names descriptivos: `should [comportamiento esperado]`
- [ ] Mocks con `vi.fn()`, limpieza en `beforeEach`
- [ ] Happy path + edge cases + error handling
- [ ] No globals ni estado compartido entre tests
- [ ] JSDoc al inicio del archivo de test
- [ ] Archivo colocado junto al fuente (`.test.ts` / `.test.tsx`)
- [ ] Cobertura: Frontend >= 70%, Backend >= 80%
