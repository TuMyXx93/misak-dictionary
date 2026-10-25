import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AdminThemeProvider, useAdminTheme } from './AdminThemeContext';

describe('AdminThemeContext', () => {
  let metaColorScheme: HTMLMetaElement;

  beforeEach(() => {
    window.localStorage.removeItem('misak-admin-theme');
    delete document.documentElement.dataset.adminTheme;
    metaColorScheme = document.createElement('meta');
    metaColorScheme.setAttribute('name', 'color-scheme');
    metaColorScheme.setAttribute('content', 'dark');
    document.head.appendChild(metaColorScheme);
  });

  afterEach(() => {
    metaColorScheme.remove();
    window.localStorage.removeItem('misak-admin-theme');
    delete document.documentElement.dataset.adminTheme;
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <AdminThemeProvider>{children}</AdminThemeProvider>
  );

  it('inicia por defecto en modo light (Opción A confirmada) y sincroniza meta color-scheme', () => {
    const { result, unmount } = renderHook(() => useAdminTheme(), { wrapper });

    expect(result.current.mode).toBe('light');
    expect(result.current.resolvedTheme).toBe('light');
    expect(document.documentElement.dataset.adminTheme).toBe('light');
    expect(metaColorScheme.getAttribute('content')).toBe('light');

    // Al salir de /admin/* restaura color-scheme dark del portal público
    unmount();
    expect(document.documentElement.dataset.adminTheme).toBeUndefined();
    expect(metaColorScheme.getAttribute('content')).toBe('dark');
  });

  it('permite alternar entre light, dark y system persistiendo en localStorage', () => {
    const { result } = renderHook(() => useAdminTheme(), { wrapper });

    act(() => {
      result.current.toggleLightDark();
    });

    expect(result.current.mode).toBe('dark');
    expect(result.current.resolvedTheme).toBe('dark');
    expect(window.localStorage.getItem('misak-admin-theme')).toBe('dark');
    expect(metaColorScheme.getAttribute('content')).toBe('dark');

    act(() => {
      result.current.setMode('system');
    });

    expect(result.current.mode).toBe('system');
    expect(window.localStorage.getItem('misak-admin-theme')).toBe('system');
    expect(metaColorScheme.getAttribute('content')).toBe('light dark');
  });
});
