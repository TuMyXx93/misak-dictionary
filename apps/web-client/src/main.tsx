import { registerSW } from 'virtual:pwa-register';
import { ErrorBoundary } from '@components/errors/ErrorBoundary';
import { LoadingScreen } from '@components/ui/LoadingScreen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { AudioPlayerProvider } from '@/contexts/AudioPlayerContext';
import { GlobalSearchProvider } from '@/contexts/GlobalSearchContext';
import { shouldRetryQuery } from '@/lib/queryRetry';
import { router } from './router/index';
import './index.css';

// Spec 003: cliente de react-query para la capa de datos del diccionario
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: shouldRetryQuery,
      refetchOnWindowFocus: false,
    },
  },
});

if ('serviceWorker' in navigator) {
  registerSW({
    immediate: true,
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
      <QueryClientProvider client={queryClient}>
        <AudioPlayerProvider>
          <GlobalSearchProvider>
            <Suspense fallback={<LoadingScreen />}>
              <RouterProvider router={router} />
            </Suspense>
          </GlobalSearchProvider>
        </AudioPlayerProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
