/**
 * useDeepLinkAnchor.test.tsx
 * Spec 012 (v0.3.0 / R-018) — Tests de anclaje profundo #term-{id} / #subnivel-{slug},
 * coordinación con useRouteFocus y resaltado post-scroll data-deep-linked="true".
 */

import { act, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDeepLinkAnchor } from './useDeepLinkAnchor';
import { useRouteFocus } from './useRouteFocus';

const DeepLinkFixture = ({ asyncMount = false }: { asyncMount?: boolean }) => {
  const [ready, setReady] = useState(!asyncMount);
  useRouteFocus();
  useDeepLinkAnchor();

  return (
    <main id="main-content">
      {/* biome-ignore lint/a11y/noNoninteractiveTabindex: requerido para validar que h1 NO robe foco en deep-link */}
      <h1 tabIndex={-1}>Microcampo Wammera</h1>
      {!ready ? (
        <button type="button" onClick={() => setReady(true)}>
          Montar términos
        </button>
      ) : (
        <>
          <section id="subnivel-plantas-frias">
            <h3>Plantas frías</h3>
          </section>
          <article id="term-745">Kɵnchapik — Estrella</article>
        </>
      )}
    </main>
  );
};

describe('useDeepLinkAnchor + useRouteFocus (Spec 012 v0.3.0 / R-018)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('desplaza el viewport al término #term-{id}, aplica data-deep-linked="true" y evita que useRouteFocus regrese al h1', () => {
    const scrollSpy = vi.fn();
    Element.prototype.scrollIntoView = scrollSpy;

    render(
      <MemoryRouter initialEntries={['/campos/ya/nakchak/wammera#term-745']}>
        <DeepLinkFixture />
      </MemoryRouter>,
    );

    act(() => {
      vi.advanceTimersByTime(50);
    });

    const termEl = document.getElementById('term-745');
    const h1El = screen.getByRole('heading', { level: 1 });

    expect(termEl).toHaveAttribute('data-deep-linked', 'true');
    expect(scrollSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        block: 'center',
      }),
    );
    expect(document.activeElement).not.toBe(h1El);

    // Tras 2600ms limpia automáticamente el resaltado temporal
    act(() => {
      vi.advanceTimersByTime(2700);
    });
    expect(termEl).not.toHaveAttribute('data-deep-linked');
  });

  it('espera mediante MutationObserver cuando el subnivel #subnivel-{slug} se hidrata asíncronamente', () => {
    const scrollSpy = vi.fn();
    Element.prototype.scrollIntoView = scrollSpy;

    render(
      <MemoryRouter
        initialEntries={['/campos/ya-tul/medicina/plantas-medicinales#subnivel-plantas-frias']}
      >
        <DeepLinkFixture asyncMount />
      </MemoryRouter>,
    );

    expect(document.getElementById('subnivel-plantas-frias')).toBeNull();

    act(() => {
      screen.getByRole('button', { name: 'Montar términos' }).click();
    });

    // MutationObserver dispara microtarea al montar el nodo
    return Promise.resolve().then(() => {
      const subnivelEl = document.getElementById('subnivel-plantas-frias');
      expect(subnivelEl).toHaveAttribute('data-deep-linked', 'true');
      expect(scrollSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          block: 'start',
        }),
      );
    });
  });
});
