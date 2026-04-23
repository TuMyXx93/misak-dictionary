import { registerSW } from 'virtual:pwa-register';
import { ErrorBoundary } from '@components/errors/ErrorBoundary';
import { LoadingScreen } from '@components/ui/LoadingScreen';
import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router/index';
import './index.css';

if ('serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onNeedRefresh() {
      console.log('[PWA] Nueva versión disponible. Recarga para actualizar.');
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

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <ErrorBoundary>
      <Suspense fallback={<LoadingScreen />}>
        <RouterProvider router={router} />
      </Suspense>
    </ErrorBoundary>
  </StrictMode>,
);
