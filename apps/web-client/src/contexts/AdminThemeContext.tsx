/**
 * AdminThemeContext
 *
 * Único controlador de modo Claro / Oscuro de la plataforma, montado exclusivamente
 * dentro del Panel Administrativo (/admin/*).
 *
 * - Default inicial confirmado: 'light' (Modo Claro) en la primera apertura.
 * - Soporta 3 estados ('light', 'dark', 'system') persistidos en localStorage.
 * - Restaura automáticamente el esquema oscuro curado al salir hacia rutas públicas.
 */

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type AdminThemeMode = 'light' | 'dark' | 'system';
export type ResolvedAdminTheme = 'light' | 'dark';

const STORAGE_KEY = 'misak-admin-theme';

export interface AdminThemeContextValue {
  mode: AdminThemeMode;
  resolvedTheme: ResolvedAdminTheme;
  systemPrefersDark: boolean;
  setMode: (nextMode: AdminThemeMode) => void;
  toggleLightDark: () => void;
}

const DEFAULT_CONTEXT: AdminThemeContextValue = {
  mode: 'light',
  resolvedTheme: 'light',
  systemPrefersDark: false,
  setMode: () => undefined,
  toggleLightDark: () => undefined,
};

const AdminThemeContext = createContext<AdminThemeContextValue>(DEFAULT_CONTEXT);

function readStoredMode(): AdminThemeMode {
  if (typeof window === 'undefined') return 'light';
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === 'light' || raw === 'dark' || raw === 'system') {
      return raw;
    }
  } catch {
    // Ignorar errores de almacenamiento restringido
  }
  return 'light';
}

function getSystemDarkPreference(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function syncDocumentMeta(mode: AdminThemeMode, resolvedTheme?: ResolvedAdminTheme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.adminTheme = mode;
  if (resolvedTheme) {
    document.documentElement.dataset.adminResolved = resolvedTheme;
  }
  const meta = document.querySelector('meta[name="color-scheme"]');
  if (meta) {
    meta.setAttribute('content', mode === 'system' ? 'light dark' : mode);
  }
}

export const AdminThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setModeState] = useState<AdminThemeMode>(() => readStoredMode());
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() =>
    getSystemDarkPreference(),
  );

  const resolvedTheme: ResolvedAdminTheme = useMemo(() => {
    if (mode === 'system') {
      return systemPrefersDark ? 'dark' : 'light';
    }
    return mode;
  }, [mode, systemPrefersDark]);

  // Escuchar cambios del sistema operativo en tiempo real
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemPrefersDark(event.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Sincronización entre pestañas administrativas abiertas
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        setModeState(readStoredMode());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Aplicar tema activo mientras el usuario esté dentro del panel administrativo
  // y restaurar el modo oscuro fijo del portal público al salir.
  useEffect(() => {
    syncDocumentMeta(mode, resolvedTheme);
    return () => {
      if (typeof document !== 'undefined') {
        delete document.documentElement.dataset.adminTheme;
        delete document.documentElement.dataset.adminResolved;
        const meta = document.querySelector('meta[name="color-scheme"]');
        if (meta) {
          meta.setAttribute('content', 'dark');
        }
      }
    };
  }, [mode, resolvedTheme]);

  const setMode = useCallback((nextMode: AdminThemeMode) => {
    setModeState(nextMode);
    try {
      window.localStorage.setItem(STORAGE_KEY, nextMode);
    } catch {
      // Aplicar visualmente aunque localStorage falle
    }
  }, []);

  const toggleLightDark = useCallback(() => {
    const next: AdminThemeMode = resolvedTheme === 'light' ? 'dark' : 'light';
    setMode(next);
  }, [resolvedTheme, setMode]);

  const value = useMemo<AdminThemeContextValue>(
    () => ({
      mode,
      resolvedTheme,
      systemPrefersDark,
      setMode,
      toggleLightDark,
    }),
    [mode, resolvedTheme, systemPrefersDark, setMode, toggleLightDark],
  );

  return <AdminThemeContext.Provider value={value}>{children}</AdminThemeContext.Provider>;
};

export function useAdminTheme(): AdminThemeContextValue {
  return useContext(AdminThemeContext);
}
