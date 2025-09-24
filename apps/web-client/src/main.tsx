import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

createRoot(document.getElementById('root')!).render(
  <StrictMode>{/* Clean base: no UI mounted yet */}</StrictMode>,
);
