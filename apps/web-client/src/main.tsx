import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { LoadingScreen } from '@components/ui/LoadingScreen';
import { registerSW } from 'virtual:pwa-register';
import './index.css';

// Registrar Service Worker para PWA
if ('serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onNeedRefresh() {
      console.log('[PWA] Nueva versión disponible. Recarga para actualizar.');
      // Aquí se puede mostrar un toast o notification
    },
    onOfflineReady() {
      console.log('[PWA] App lista para funcionar offline.');
    },
    onRegistered(registration) {
      console.log('[PWA] Service Worker registrado:', registration);
    },
    onRegisterError(error) {
      console.error('[PWA] Error al registrar Service Worker:', error);
    },
  });
}

// Lazy load de la página principal para code splitting
const Home = lazy(() => import('@pages/Home').then((module) => ({ default: module.Home })));

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <Suspense fallback={<LoadingScreen />}>
      <Home />
    </Suspense>
  </StrictMode>,
);
