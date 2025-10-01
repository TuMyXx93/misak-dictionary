import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { Button } from '@components/ui';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className="min-h-screen bg-background text-text flex items-center justify-center p-8">
      <div className="text-center space-y-8 max-w-4xl">
        <div>
          <h1 className="text-5xl font-bold text-primary mb-4 animate-fade-in">
            Model Dictionary v1
          </h1>
          <p className="text-xl text-text-muted animate-slide-up">Diccionario Cultural Pionero</p>
        </div>

        <div className="bg-secondary/30 rounded-lg p-8 space-y-6 animate-scale-in">
          <h2 className="text-2xl font-semibold text-primary">✅ Setup Completado</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="space-y-2">
              <p className="text-text-muted">✅ TailwindCSS configurado</p>
              <p className="text-text-muted">✅ Design tokens Misak</p>
              <p className="text-text-muted">✅ Vitest configurado</p>
            </div>
            <div className="space-y-2">
              <p className="text-text-muted">✅ Componente Button creado</p>
              <p className="text-text-muted">✅ Tests implementados</p>
              <p className="text-text-muted">✅ Path aliases configurados</p>
            </div>
          </div>

          <div className="pt-4 border-t border-primary/20">
            <h3 className="text-lg font-semibold text-primary mb-4">Componente Button - Demo</h3>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button variant="primary" size="md">
                Primary
              </Button>
              <Button variant="secondary" size="md">
                Secondary
              </Button>
              <Button variant="outline" size="md">
                Outline
              </Button>
              <Button variant="ghost" size="md">
                Ghost
              </Button>
            </div>

            <div className="flex flex-wrap gap-4 justify-center mt-4">
              <Button variant="primary" size="sm">
                Small
              </Button>
              <Button variant="primary" size="md">
                Medium
              </Button>
              <Button variant="primary" size="lg">
                Large
              </Button>
            </div>

            <div className="mt-4">
              <Button variant="primary" isLoading>
                Loading State
              </Button>
            </div>
          </div>
        </div>

        <div className="text-sm text-text-muted">
          <p>Próximo paso: Configurar React Router y crear estructura de páginas</p>
        </div>
      </div>
    </div>
  </StrictMode>,
);
