# 📋 Week 2 - Plan de Desarrollo Atómico

**Proyecto:** Model Dictionary v1 - Diccionario Cultural Misak  
**Periodo:** 2025-10-10 → 2025-10-17  
**Branch:** `feature/week2-enhancements`  
**Versión Objetivo:** v0.2.0  
**Estado:** 🔄 En Progreso

---

## 🎯 Objetivos de Week 2

### Objetivo Principal

**Consolidar la calidad enterprise y preparar para escalabilidad**

Mejorar la infraestructura del proyecto con CI/CD avanzado, optimizaciones de performance, y mejoras de experiencia de usuario, manteniendo el 100% de tests pasando y agregando nuevas capacidades profesionales.

### Objetivos Específicos

1. **CI/CD Avanzado**: Pipeline completo con GitHub Actions
2. **Performance**: Optimizaciones measurables y PWA setup
3. **UX Improvements**: Error boundaries y mejores loading states
4. **Code Quality**: Coverage aumentado y lighthouse scores mejorados

---

## 📊 Métricas de Éxito Week 2

### Targets Cuantitativos

```
Tests:                  112 → 140+ tests
Coverage:               70% → 80%
Build Time:             3.84s → <3s
Bundle Size:            334KB → <300KB
Lighthouse Score:       N/A → >90 (Performance, Accessibility, Best Practices, SEO)
CI/CD Pipeline:         Manual → Automated
```

### Criterios de Aceptación Global

- ✅ Todos los tests pasando (100%)
- ✅ GitHub Actions CI/CD funcionando
- ✅ Performance mejorada (measurable)
- ✅ PWA funcional con service worker
- ✅ Error boundaries implementados
- ✅ Lighthouse score >90 en todas las categorías
- ✅ Documentación actualizada

---

## 🗂️ Estructura de Tareas (Atómicas)

## Sprint 1: CI/CD Foundation (Día 1-2)

### Task 1.1: Configurar GitHub Actions - Tests Automáticos

**Descripción:**  
Implementar workflow de GitHub Actions para ejecutar tests automáticamente en cada PR y push a main.

**Acceptance Criteria:**

- ✅ Archivo `.github/workflows/test.yml` creado
- ✅ Tests ejecutándose en cada PR
- ✅ Tests ejecutándose en push a main/develop
- ✅ Timeout configurado (15 minutos max)
- ✅ Cache de `node_modules` implementado
- ✅ Badge de status en README
- ✅ Falla el CI si tests no pasan

**Implementación:**

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 10.18.2
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm test --run
```

**Tiempo Estimado:** 2 horas  
**Prioridad:** 🔴 Alta  
**Dependencias:** Ninguna

---

### Task 1.2: Configurar GitHub Actions - Lint & Type Check

**Descripción:**  
Implementar validación de calidad de código con ESLint y TypeScript en CI.

**Acceptance Criteria:**

- ✅ Archivo `.github/workflows/lint.yml` creado
- ✅ ESLint ejecutándose sin errores
- ✅ TypeScript type-check sin errores
- ✅ Prettier check validando formato
- ✅ Falla si hay violaciones
- ✅ Comentarios automáticos en PR con issues

**Implementación:**

```yaml
name: Code Quality
on: [push, pull_request]
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm format:check
      - run: pnpm --filter web-client exec tsc --noEmit
```

**Tiempo Estimado:** 1.5 horas  
**Prioridad:** 🔴 Alta  
**Dependencias:** Task 1.1

---

### Task 1.3: Configurar GitHub Actions - Build Validation

**Descripción:**  
Validar que el build de producción funciona correctamente en CI.

**Acceptance Criteria:**

- ✅ Archivo `.github/workflows/build.yml` creado
- ✅ Build de producción exitoso
- ✅ Bundle analyzer corriendo
- ✅ Size limits validados
- ✅ Artifacts guardados (7 días)
- ✅ Deploy preview configurado (opcional)

**Implementación:**

```yaml
name: Build
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install --frozen-lockfile
      - run: pnpm build:web
      - uses: actions/upload-artifact@v3
        with:
          name: build-artifacts
          path: apps/web-client/dist/
          retention-days: 7
```

**Tiempo Estimado:** 1.5 horas  
**Prioridad:** 🔴 Alta  
**Dependencias:** Task 1.2

---

### Task 1.4: Configurar Codecov para Coverage Reports

**Descripción:**  
Integrar Codecov para tracking de cobertura de código y reports visuales.

**Acceptance Criteria:**

- ✅ Cuenta Codecov configurada
- ✅ Token configurado en GitHub Secrets
- ✅ Coverage report subiendo automáticamente
- ✅ Badge de coverage en README
- ✅ Comentarios en PR con cambios de coverage
- ✅ Threshold configurado (80% mínimo)

**Implementación:**

```yaml
- run: pnpm test:coverage
- uses: codecov/codecov-action@v3
  with:
    token: ${{ secrets.CODECOV_TOKEN }}
    files: ./apps/web-client/coverage/coverage-final.json
    fail_ci_if_error: true
```

**Tiempo Estimado:** 2 horas  
**Prioridad:** 🟡 Media  
**Dependencias:** Task 1.1

---

## Sprint 2: Performance Optimizations (Día 3-4)

### Task 2.1: Implementar Code Splitting por Ruta

**Descripción:**  
Implementar code splitting usando React.lazy y Suspense para mejorar tiempo de carga inicial.

**Acceptance Criteria:**

- ✅ Home page usando React.lazy
- ✅ Suspense boundary con loading state
- ✅ Chunks separados por ruta en build
- ✅ Bundle size reducido en initial load
- ✅ Prefetch configurado para rutas críticas
- ✅ Tests actualizados

**Implementación:**

```typescript
// apps/web-client/src/main.tsx
const Home = lazy(() => import('./pages/Home'));

function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </Suspense>
  );
}
```

**Tiempo Estimado:** 3 horas  
**Prioridad:** 🔴 Alta  
**Dependencias:** Ninguna

---

### Task 2.2: Optimizar Imágenes con Responsive Images

**Descripción:**  
Implementar imágenes responsive con srcset y sizes para diferentes viewports.

**Acceptance Criteria:**

- ✅ LazyImage component acepta multiple sources
- ✅ srcset generado automáticamente
- ✅ sizes configurado por breakpoint
- ✅ WebP support con fallback
- ✅ Tests actualizados
- ✅ Documentación del componente

**Implementación:**

```typescript
interface LazyImageProps {
  src: string;
  srcSet?: string;
  sizes?: string;
  alt: string;
  className?: string;
}

export const LazyImage: FC<LazyImageProps> = ({ src, srcSet, sizes = '100vw', ...props }) => {
  // Implementation with srcset support
};
```

**Tiempo Estimado:** 2 horas  
**Prioridad:** 🟡 Media  
**Dependencias:** Ninguna

---

### Task 2.3: Implementar Service Worker para PWA

**Descripción:**  
Configurar Vite PWA plugin para convertir la app en Progressive Web App.

**Acceptance Criteria:**

- ✅ vite-plugin-pwa instalado y configurado
- ✅ Service worker generado automáticamente
- ✅ manifest.json creado
- ✅ Assets críticos pre-cached
- ✅ Offline fallback implementado
- ✅ Lighthouse PWA score >90
- ✅ Installable en mobile/desktop

**Implementación:**

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Diccionario Misak',
        short_name: 'Misak',
        theme_color: '#38e07b',
        icons: [
          /* ... */
        ],
      },
      workbox: {
        runtimeCaching: [
          /* ... */
        ],
      },
    }),
  ],
});
```

**Tiempo Estimado:** 4 horas  
**Prioridad:** 🔴 Alta  
**Dependencias:** Task 2.1

---

### Task 2.4: Implementar Bundle Analyzer en Build

**Descripción:**  
Agregar bundle analyzer para visualizar tamaño de chunks y identificar optimizaciones.

**Acceptance Criteria:**

- ✅ rollup-plugin-visualizer instalado
- ✅ Comando `pnpm analyze` creado
- ✅ Report HTML generado en build
- ✅ Size limits configurados en CI
- ✅ Documentación en README

**Implementación:**

```typescript
// vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    visualizer({
      filename: './dist/stats.html',
      open: true,
      gzipSize: true,
    }),
  ],
});
```

**Tiempo Estimado:** 1 hora  
**Prioridad:** 🟡 Media  
**Dependencias:** Ninguna

---

## Sprint 3: UX Improvements (Día 5-6)

### Task 3.1: Implementar Error Boundaries

**Descripción:**  
Crear Error Boundary component para manejar errores gracefully en React.

**Acceptance Criteria:**

- ✅ ErrorBoundary component creado
- ✅ Fallback UI profesional
- ✅ Error logging implementado
- ✅ Reset functionality
- ✅ Tests para error scenarios
- ✅ Wrapping de componentes críticos
- ✅ Documentación

**Implementación:**

```typescript
// apps/web-client/src/components/errors/ErrorBoundary.tsx
export class ErrorBoundary extends Component<Props, State> {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Future: Send to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} reset={this.resetError} />;
    }
    return this.props.children;
  }
}
```

**Tiempo Estimado:** 3 horas  
**Prioridad:** 🔴 Alta  
**Dependencias:** Ninguna

---

### Task 3.2: Mejorar Loading States

**Descripción:**  
Crear skeleton loaders profesionales para secciones durante carga.

**Acceptance Criteria:**

- ✅ Skeleton component reutilizable creado
- ✅ Skeletons para cada sección
- ✅ Animación de shimmer
- ✅ Matching de layout con contenido real
- ✅ Tests para loading states
- ✅ Storybook stories (opcional)

**Implementación:**

```typescript
// apps/web-client/src/components/ui/Skeleton.tsx
export const Skeleton: FC<SkeletonProps> = ({
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
}) => {
  return (
    <div
      className={cn(
        'bg-gray-200 animate-pulse',
        variant === 'circular' && 'rounded-full',
        variant === 'rectangular' && 'rounded',
      )}
      style={{ width, height }}
    />
  );
};
```

**Tiempo Estimado:** 2.5 horas  
**Prioridad:** 🟡 Media  
**Dependencias:** Ninguna

---

### Task 3.3: Implementar 404 Page Not Found

**Descripción:**  
Crear página 404 personalizada con navegación útil.

**Acceptance Criteria:**

- ✅ NotFound component creado
- ✅ Diseño consistente con app
- ✅ Links útiles para navegación
- ✅ Animación suave
- ✅ SEO meta tags
- ✅ Tests

**Implementación:**

```typescript
// apps/web-client/src/pages/NotFound.tsx
export const NotFound: FC = () => {
  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <p className="text-2xl mt-4">Página no encontrada</p>
        <Button onClick={() => navigate('/')} className="mt-8">
          Volver al inicio
        </Button>
      </div>
    </MainLayout>
  );
};
```

**Tiempo Estimado:** 1.5 horas  
**Prioridad:** 🟢 Baja  
**Dependencias:** Ninguna

---

### Task 3.4: Mejorar Accessibility (A11y)

**Descripción:**  
Auditar y mejorar accesibilidad de todos los componentes.

**Acceptance Criteria:**

- ✅ Todas las imágenes tienen alt text
- ✅ Contraste de colores >4.5:1
- ✅ Keyboard navigation funcional
- ✅ ARIA labels en componentes interactivos
- ✅ Focus indicators visibles
- ✅ Lighthouse Accessibility score >95
- ✅ Screen reader testing básico

**Tasks específicas:**

```
- Revisar todos los LazyImage alt texts
- Agregar aria-label a botones sin texto
- Mejorar focus indicators en hotspots
- Validar heading hierarchy (h1, h2, h3)
- Agregar skip-to-content link
- Testear con screen reader
```

**Tiempo Estimado:** 3 horas  
**Prioridad:** 🔴 Alta  
**Dependencias:** Ninguna

---

## Sprint 4: Testing & Quality (Día 7)

### Task 4.1: Aumentar Coverage a 80%

**Descripción:**  
Agregar tests faltantes para alcanzar 80% de cobertura.

**Acceptance Criteria:**

- ✅ Coverage aumentado de 70% → 80%
- ✅ Todos los utils cubiertos al 100%
- ✅ Hooks custom testeados
- ✅ Error boundaries testeados
- ✅ Loading states testeados
- ✅ Tests de integración agregados

**Archivos prioritarios:**

```
- useLazyImage hook (actualmente sin tests)
- ErrorBoundary component
- Skeleton component
- NotFound page
- New utility functions
```

**Tiempo Estimado:** 4 horas  
**Prioridad:** 🔴 Alta  
**Dependencias:** Tasks 3.1, 3.2, 3.3

---

### Task 4.2: Lighthouse Audit & Optimization

**Descripción:**  
Ejecutar Lighthouse audit y optimizar para scores >90 en todas las categorías.

**Acceptance Criteria:**

- ✅ Lighthouse CI configurado
- ✅ Performance score >90
- ✅ Accessibility score >95
- ✅ Best Practices score >95
- ✅ SEO score >90
- ✅ PWA score >90 (con Task 2.3)
- ✅ Report guardado en CI artifacts

**Optimizaciones esperadas:**

```
Performance:
- First Contentful Paint <1.8s
- Largest Contentful Paint <2.5s
- Cumulative Layout Shift <0.1
- Time to Interactive <3.8s

SEO:
- Meta descriptions
- Semantic HTML
- robots.txt
- sitemap.xml
```

**Tiempo Estimado:** 3 horas  
**Prioridad:** 🔴 Alta  
**Dependencias:** Tasks 2.1, 2.3, 3.4

---

### Task 4.3: Documentar Nuevas Features

**Descripción:**  
Actualizar documentación con todas las nuevas features de Week 2.

**Acceptance Criteria:**

- ✅ README actualizado con nuevos comandos
- ✅ TESTING-GUIDE actualizado
- ✅ PWA-SETUP.md creado
- ✅ CI-CD-GUIDE.md creado
- ✅ Changelog actualizado
- ✅ Contribution guide actualizado

**Documentos a crear/actualizar:**

```
- docs/features/PWA-SETUP.md
- docs/development/CI-CD-GUIDE.md
- docs/development/PERFORMANCE-OPTIMIZATION.md
- README.md (badges, nuevos comandos)
- CHANGELOG.md (v0.2.0)
```

**Tiempo Estimado:** 2 horas  
**Prioridad:** 🟡 Media  
**Dependencias:** Todas las tasks anteriores

---

## 📋 Resumen de Tareas

### Por Prioridad

**🔴 Alta Prioridad (13 tasks):**

1. GitHub Actions - Tests (Task 1.1)
2. GitHub Actions - Lint & Type Check (Task 1.2)
3. GitHub Actions - Build (Task 1.3)
4. Code Splitting (Task 2.1)
5. Service Worker PWA (Task 2.3)
6. Error Boundaries (Task 3.1)
7. Accessibility Improvements (Task 3.4)
8. Increase Coverage (Task 4.1)
9. Lighthouse Audit (Task 4.2)

**🟡 Media Prioridad (4 tasks):** 10. Codecov Integration (Task 1.4) 11. Responsive Images (Task 2.2) 12. Bundle Analyzer (Task 2.4) 13. Skeleton Loaders (Task 3.2) 14. Documentation (Task 4.3)

**🟢 Baja Prioridad (1 task):** 15. 404 Page (Task 3.3)

### Por Sprint

```
Sprint 1 (CI/CD):    4 tasks = ~7 horas
Sprint 2 (Perf):     4 tasks = ~10 horas
Sprint 3 (UX):       4 tasks = ~10 horas
Sprint 4 (Quality):  3 tasks = ~9 horas
-------------------------------------------
TOTAL:              15 tasks = ~36 horas
```

---

## 🎯 Criterios de Éxito Week 2

### Must Have (Bloqueantes para v0.2.0)

- ✅ GitHub Actions CI/CD funcionando
- ✅ PWA funcional con service worker
- ✅ Error boundaries implementados
- ✅ Coverage >80%
- ✅ Lighthouse Performance >90
- ✅ Tests 100% passing

### Should Have (Deseables)

- ✅ Code splitting funcionando
- ✅ Skeleton loaders
- ✅ Codecov integrado
- ✅ Bundle analyzer setup
- ✅ 404 page

### Nice to Have (Opcionales)

- 🔄 Responsive images
- 🔄 Storybook stories
- 🔄 E2E tests básicos

---

## 📊 Tracking Progress

### Daily Checklist

**Día 1-2 (CI/CD Foundation):**

- [ ] Task 1.1: GitHub Actions Tests
- [ ] Task 1.2: GitHub Actions Lint
- [ ] Task 1.3: GitHub Actions Build
- [ ] Task 1.4: Codecov Integration
- [ ] Push progress to GitHub
- [ ] Update todo list

**Día 3-4 (Performance):**

- [ ] Task 2.1: Code Splitting
- [ ] Task 2.2: Responsive Images
- [ ] Task 2.3: Service Worker PWA
- [ ] Task 2.4: Bundle Analyzer
- [ ] Validate Lighthouse scores
- [ ] Push progress to GitHub

**Día 5-6 (UX Improvements):**

- [ ] Task 3.1: Error Boundaries
- [ ] Task 3.2: Skeleton Loaders
- [ ] Task 3.3: 404 Page
- [ ] Task 3.4: Accessibility Audit
- [ ] User testing (manual)
- [ ] Push progress to GitHub

**Día 7 (Quality & Docs):**

- [ ] Task 4.1: Increase Coverage
- [ ] Task 4.2: Lighthouse Audit
- [ ] Task 4.3: Documentation
- [ ] Final validation
- [ ] Prepare for merge
- [ ] Create v0.2.0 tag

---

## 🚀 Deployment Strategy Week 2

### Pre-merge Checklist

```bash
# Validation completa antes de merge
✅ pnpm test --run          # Todos los tests pasando
✅ pnpm lint                # Sin errores ni warnings
✅ pnpm type-check          # TypeScript válido
✅ pnpm build:web           # Build exitoso
✅ pnpm test:coverage       # Coverage >80%
✅ GitHub Actions passing   # CI/CD verde
✅ Lighthouse score >90     # Performance validado
✅ Manual testing           # UX validado
```

### Merge Strategy

```bash
# 1. Merge feature/week2-enhancements → main
git checkout main
git merge --no-ff feature/week2-enhancements

# 2. Create v0.2.0 tag
git tag -a v0.2.0 -m "Release v0.2.0: CI/CD + Performance + UX"

# 3. Push to GitHub
git push origin main
git push origin v0.2.0
```

---

## 📚 Referencias y Recursos

### Documentación Técnica

- [GitHub Actions Docs](https://docs.github.com/actions)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)

### Herramientas

- Codecov: https://codecov.io/
- Bundle Analyzer: rollup-plugin-visualizer
- Lighthouse: Chrome DevTools

---

## 🎓 Learnings & Best Practices Week 2

### CI/CD

- Usar cache de pnpm para acelerar builds
- Configurar timeouts apropiados (15 min)
- Fail fast en quality gates
- Artifacts con retention 7 días

### Performance

- Code splitting solo en rutas, no en componentes pequeños
- PWA precache solo assets críticos
- Bundle analyzer para identificar bloat
- Lazy loading solo imágenes below fold

### UX

- Error boundaries en boundaries naturales de la app
- Skeleton loaders matching real content
- Focus management en modals/dialogs
- Keyboard navigation testing manual

### Testing

- Tests de integración más valiosos que unit en componentes
- Mock external dependencies (APIs, images)
- Test error states y edge cases
- Coverage no es el único indicador de calidad

---

**Preparado por:** AI Assistant  
**Fecha:** 2025-10-10  
**Versión del Plan:** 1.0  
**Estado:** ✅ Listo para ejecución
