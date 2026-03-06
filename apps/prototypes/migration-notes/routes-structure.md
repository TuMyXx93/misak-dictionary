# Estructura de Rutas - Navegación Semántica

## 📋 Propósito

Define la estructura de rutas (URLs) para la navegación jerárquica del diccionario, desde campos semánticos hasta palabras individuales.

---

## 🗺️ Mapa de Rutas Completo

```typescript
// apps/web-client/src/App.tsx o router.tsx

const routes = [
  // Homepage (ya existe)
  {
    path: '/',
    element: <Home />,
    description: 'Página principal con storytelling'
  },

  // Campos Semánticos (nivel 1)
  {
    path: '/campos-semanticos',
    element: <CamposSemanticosList />,
    description: 'Lista de todos los campos semánticos'
  },
  {
    path: '/campo-semantico/:fieldId',
    element: <SemanticField />,
    description: 'Vista detallada de un campo semántico con subcampos'
  },

  // Subcampos (nivel 2)
  {
    path: '/campo-semantico/:fieldId/subcampo/:subId',
    element: <Subfield />,
    description: 'Vista de subcampo con microcampos'
  },

  // Microcampos (nivel 3)
  {
    path: '/campo-semantico/:fieldId/subcampo/:subId/microcampo/:microId',
    element: <Microfield />,
    description: 'Vista de microcampo con preview de palabras'
  },

  // Palabras
  {
    path: '/microcampo/:microId/palabras',
    element: <WordsList />,
    description: 'Lista completa de palabras de un microcampo'
  },
  {
    path: '/palabra/:wordId',
    element: <WordDetail />,
    description: 'Detalle completo de una palabra'
  },

  // Búsqueda
  {
    path: '/buscar',
    element: <Search />,
    description: 'Búsqueda global de palabras'
  },

  // 404
  {
    path: '*',
    element: <NotFound />,
    description: 'Página no encontrada'
  }
];
```

---

## 🌳 Jerarquía de Navegación

```
Homepage (/)
│
├─→ Campos Semánticos (/campos-semanticos)
│   │
│   └─→ Campo Individual (/campo-semantico/:fieldId)
│       │   Ejemplo: /campo-semantico/wallikato
│       │
│       └─→ Subcampo (/campo-semantico/:fieldId/subcampo/:subId)
│           │   Ejemplo: /campo-semantico/wallikato/subcampo/flora
│           │
│           └─→ Microcampo (.../microcampo/:microId)
│               │   Ejemplo: /campo-semantico/wallikato/subcampo/flora/microcampo/plantas-medicinales
│               │
│               └─→ Lista de Palabras (/microcampo/:microId/palabras)
│                   │   Ejemplo: /microcampo/plantas-medicinales/palabras
│                   │
│                   └─→ Palabra Individual (/palabra/:wordId)
│                       Ejemplo: /palabra/yerbatero
│
├─→ Búsqueda Global (/buscar?q=término)
│
└─→ Admin Panel (/admin/*) - Futuro
```

---

## 📝 Definición de Rutas por Página

### 1. Homepage `/`

**Componente**: `apps/web-client/src/pages/Home.tsx` (ya existe)

**Estado**: Actualizar con navegación a campos semánticos

**Elementos de navegación**:

- CTA button: "Explorar Campos Semánticos" → `/campos-semanticos`
- Hotspots interactivos → `/campo-semantico/:id`

---

### 2. Lista de Campos Semánticos `/campos-semanticos`

**Componente**: `apps/web-client/src/pages/CamposSemanticosList.tsx` (nuevo)

**Params**: Ninguno  
**Query params**:

- `?search=término` - Búsqueda
- `?sort=nombre|fecha` - Ordenamiento

**Data fetching**:

```typescript
const { data } = useQuery({
  queryKey: ['semantic-fields'],
  queryFn: () => api.get('/api/dictionary/semantic-fields'),
});
```

**Navegación**:

- Click en card → `/campo-semantico/:fieldId`

---

### 3. Campo Semántico `/campo-semantico/:fieldId`

**Componente**: `apps/web-client/src/pages/SemanticField.tsx` (nuevo)

**Params**:

- `fieldId` (string) - ID del campo semántico

**Ejemplo URLs**:

```
/campo-semantico/1
/campo-semantico/wallikato
/campo-semantico/cmSeXyz123
```

**Data fetching**:

```typescript
const { fieldId } = useParams();
const { data } = useQuery({
  queryKey: ['semantic-field', fieldId],
  queryFn: () => api.get(`/api/dictionary/semantic-fields/${fieldId}`),
});
```

**Breadcrumbs**:

```
Inicio > Campos Semánticos > [Nombre del Campo]
```

**Navegación**:

- Back button → `/campos-semanticos`
- Click en subcampo → `/campo-semantico/:fieldId/subcampo/:subId`

---

### 4. Subcampo `/campo-semantico/:fieldId/subcampo/:subId`

**Componente**: `apps/web-client/src/pages/Subfield.tsx` (nuevo)

**Params**:

- `fieldId` (string) - ID del campo semántico padre
- `subId` (string) - ID del subcampo

**Ejemplo URLs**:

```
/campo-semantico/wallikato/subcampo/flora
/campo-semantico/1/subcampo/2
```

**Data fetching**:

```typescript
const { fieldId, subId } = useParams();
const { data: subfield } = useQuery({
  queryKey: ['subfield', subId],
  queryFn: () => api.get(`/api/dictionary/subcampos/${subId}`),
});

// También fetch del campo padre para breadcrumbs
const { data: field } = useQuery({
  queryKey: ['semantic-field', fieldId],
  queryFn: () => api.get(`/api/dictionary/semantic-fields/${fieldId}`),
});
```

**Breadcrumbs**:

```
Inicio > Campos Semánticos > [Campo] > [Subcampo]
```

**Navegación**:

- Back button → `/campo-semantico/:fieldId`
- Click en microcampo → `.../microcampo/:microId`

---

### 5. Microcampo `/campo-semantico/:fieldId/subcampo/:subId/microcampo/:microId`

**Componente**: `apps/web-client/src/pages/Microfield.tsx` (nuevo)

**Params**:

- `fieldId` (string) - ID del campo semántico
- `subId` (string) - ID del subcampo
- `microId` (string) - ID del microcampo

**Ejemplo URLs**:

```
/campo-semantico/wallikato/subcampo/flora/microcampo/plantas-medicinales
/campo-semantico/1/subcampo/2/microcampo/3
```

**Data fetching**:

```typescript
const { fieldId, subId, microId } = useParams();
const { data: microfield } = useQuery({
  queryKey: ['microfield', microId],
  queryFn: () => api.get(`/api/dictionary/microcampos/${microId}`),
});
```

**Breadcrumbs**:

```
Inicio > Campos Semánticos > [Campo] > [Subcampo] > [Microcampo]
```

**Navegación**:

- Back button → `/campo-semantico/:fieldId/subcampo/:subId`
- "Ver todas las palabras" → `/microcampo/:microId/palabras`
- Click en palabra → `/palabra/:wordId`

---

### 6. Lista de Palabras `/microcampo/:microId/palabras`

**Componente**: `apps/web-client/src/pages/WordsList.tsx` (nuevo)

**Params**:

- `microId` (string) - ID del microcampo

**Query params**:

- `?idioma=namtrik|espanol|todos` - Filtro de idioma
- `?search=término` - Búsqueda
- `?page=1` - Paginación
- `?pageSize=20` - Tamaño de página

**Ejemplo URLs**:

```
/microcampo/plantas-medicinales/palabras
/microcampo/plantas-medicinales/palabras?idioma=namtrik
/microcampo/plantas-medicinales/palabras?search=remedio&page=2
```

**Data fetching**:

```typescript
const { microId } = useParams();
const [searchParams] = useSearchParams();

const { data } = useQuery({
  queryKey: ['microfield-words', microId, searchParams.toString()],
  queryFn: () =>
    api.get(`/api/dictionary/microcampos/${microId}/words`, {
      params: Object.fromEntries(searchParams),
    }),
});
```

**Breadcrumbs**:

```
Inicio > ... > [Microcampo] > Palabras
```

**Navegación**:

- Back button → `/campo-semantico/:fieldId/subcampo/:subId/microcampo/:microId`
- Click en palabra → `/palabra/:wordId` o modal

---

### 7. Detalle de Palabra `/palabra/:wordId`

**Componente**: `apps/web-client/src/pages/WordDetail.tsx` (nuevo)

**Params**:

- `wordId` (string) - ID de la palabra

**Ejemplo URLs**:

```
/palabra/yerbatero
/palabra/123
```

**Data fetching**:

```typescript
const { wordId } = useParams();
const { data } = useQuery({
  queryKey: ['word', wordId],
  queryFn: () => api.get(`/api/dictionary/words/${wordId}`),
});
```

**Alternativa**: Puede ser un **modal** en lugar de página completa

```typescript
// En WordsList.tsx
const [selectedWordId, setSelectedWordId] = useState<string | null>(null);

<WordDetailModal
  wordId={selectedWordId}
  isOpen={!!selectedWordId}
  onClose={() => setSelectedWordId(null)}
/>
```

---

### 8. Búsqueda Global `/buscar`

**Componente**: `apps/web-client/src/pages/Search.tsx` (nuevo)

**Params**: Ninguno  
**Query params**:

- `?q=término` - Término de búsqueda (requerido)
- `?idioma=namtrik|espanol|todos` - Filtro de idioma
- `?campo=:fieldId` - Filtrar por campo semántico

**Ejemplo URLs**:

```
/buscar?q=naturaleza
/buscar?q=yerbatero&idioma=namtrik
/buscar?q=planta&campo=wallikato
```

**Data fetching**:

```typescript
const [searchParams] = useSearchParams();
const query = searchParams.get('q');

const { data } = useQuery({
  queryKey: ['search', query, searchParams.toString()],
  queryFn: () =>
    api.get('/api/dictionary/words/search', {
      params: { term: query, ...Object.fromEntries(searchParams) },
    }),
  enabled: !!query,
});
```

---

## 🔄 Navegación y Patrones

### React Router Setup

```typescript
// apps/web-client/src/main.tsx o App.tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: <Home />
      },
      {
        path: 'campos-semanticos',
        element: <CamposSemanticosList />
      },
      {
        path: 'campo-semantico/:fieldId',
        element: <SemanticField />
      },
      {
        path: 'campo-semantico/:fieldId/subcampo/:subId',
        element: <Subfield />
      },
      {
        path: 'campo-semantico/:fieldId/subcampo/:subId/microcampo/:microId',
        element: <Microfield />
      },
      {
        path: 'microcampo/:microId/palabras',
        element: <WordsList />
      },
      {
        path: 'palabra/:wordId',
        element: <WordDetail />
      },
      {
        path: 'buscar',
        element: <Search />
      },
      {
        path: '*',
        element: <NotFound />
      }
    ]
  }
]);

export default function App() {
  return <RouterProvider router={router} />;
}
```

---

### Navegación Programática

```typescript
// Usando useNavigate hook
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

// Navegar a página
navigate('/campo-semantico/wallikato');

// Navegar con estado
navigate('/palabra/123', { state: { from: 'search' } });

// Navegar atrás
navigate(-1);

// Reemplazar en historial
navigate('/nuevo', { replace: true });
```

---

### Links con Breadcrumbs

```typescript
// Componente Breadcrumbs.tsx
import { Link } from 'react-router-dom';

<nav aria-label="breadcrumb">
  <ol className="flex items-center gap-2">
    <li><Link to="/">Inicio</Link></li>
    <li><span>→</span></li>
    <li><Link to="/campos-semanticos">Campos Semánticos</Link></li>
    <li><span>→</span></li>
    <li aria-current="page">Wallikatɵ</li>
  </ol>
</nav>
```

---

## 🎯 Consideraciones de UX

### Deep Linking

Todas las páginas deben ser **directamente accesibles** vía URL:

```typescript
// ✅ Bueno: URL compartible
/campo-semantico/wallikato/subcampo/flora/microcampo/plantas-medicinales

// ❌ Malo: Estado no persistente
/campos-semanticos (con modal abierto sin URL)
```

---

### State Preservation

Preservar estado de búsqueda y filtros en URL:

```typescript
// ✅ Bueno
/microcampo/plantas-medicinales/palabras?idioma=namtrik&search=yerbatero&page=2

// Usuarios pueden:
// - Compartir búsqueda exacta
// - Usar botón "atrás"
// - Bookmark resultados
```

---

### Lazy Loading de Rutas

Para optimizar bundle size:

```typescript
import { lazy, Suspense } from 'react';

const SemanticField = lazy(() => import('./pages/SemanticField'));
const Subfield = lazy(() => import('./pages/Subfield'));
const WordsList = lazy(() => import('./pages/WordsList'));

<Route
  path="/campo-semantico/:fieldId"
  element={
    <Suspense fallback={<LoadingScreen />}>
      <SemanticField />
    </Suspense>
  }
/>
```

---

### Scroll Restoration

Restaurar scroll position al navegar:

```typescript
// En router config
const router = createBrowserRouter(routes, {
  future: {
    v7_scrollRestoration: true,
  },
});
```

---

## 📊 Ejemplo de Flujo Completo

```
Usuario inicia en Homepage
  ↓
Click en "Explorar Campos Semánticos"
  ↓
/campos-semanticos - Ve lista de campos
  ↓
Click en "Wallikatɵ (Naturaleza)"
  ↓
/campo-semantico/wallikato - Ve subcampos
  ↓
Click en "Flora"
  ↓
/campo-semantico/wallikato/subcampo/flora - Ve microcampos
  ↓
Click en "Plantas medicinales"
  ↓
/campo-semantico/wallikato/subcampo/flora/microcampo/plantas-medicinales
  ↓
Click en "Ver todas las palabras"
  ↓
/microcampo/plantas-medicinales/palabras
  ↓
Filtra por idioma Namtrik
  ↓
/microcampo/plantas-medicinales/palabras?idioma=namtrik
  ↓
Click en palabra "Yerbatero"
  ↓
Modal o /palabra/yerbatero
```

---

## 🔐 Rutas Protegidas (Futuro)

Para el panel de administración:

```typescript
// Admin routes (futuro)
{
  path: '/admin',
  element: <ProtectedRoute><AdminLayout /></ProtectedRoute>,
  children: [
    { path: 'dashboard', element: <AdminDashboard /> },
    { path: 'palabras', element: <AdminWords /> },
    { path: 'campos', element: <AdminFields /> },
    { path: 'usuarios', element: <AdminUsers /> }
  ]
}

// ProtectedRoute component
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
```

---

## ✅ Checklist de Implementación

- [ ] Configurar React Router v7
- [ ] Crear componentes de página base
- [ ] Implementar breadcrumbs dinámicos
- [ ] Añadir lazy loading para rutas
- [ ] Configurar scroll restoration
- [ ] Implementar manejo de 404
- [ ] Añadir SEO metadata por ruta
- [ ] Implementar deep linking
- [ ] Testing de navegación
- [ ] Documentar rutas en README

---

**Última actualización**: 2025-10-23  
**Responsable**: Equipo de desarrollo Tumi-dev
