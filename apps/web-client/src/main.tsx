import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { LoadingScreen } from '@components/ui/LoadingScreen';
import './index.css';

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
