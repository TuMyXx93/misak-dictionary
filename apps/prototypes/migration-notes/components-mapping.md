# Mapeo de Componentes HTML → React

## 📋 Propósito

Este documento mapea elementos HTML de los prototipos a componentes React reutilizables, facilitando la migración y manteniendo consistencia en el diseño.

---

## 🎨 Componentes por Categoría

### 1. Navegación y Jerarquía

#### Breadcrumbs

**Ubicación HTML**: Probablemente en header de cada página  
**Componente React**: `apps/web-client/src/components/ui/Breadcrumbs.tsx`

```typescript
interface BreadcrumbsProps {
  items: Array<{
    label: string;
    href?: string;
    active?: boolean;
  }>;
}

// Ejemplo de uso:
<Breadcrumbs
  items={[
    { label: 'Inicio', href: '/' },
    { label: 'Naturaleza', href: '/campo-semantico/1' },
    { label: 'Flora', href: '/campo-semantico/1/subcampo/2' },
    { label: 'Plantas medicinales', active: true }
  ]}
/>
```

**Estilos TailwindCSS**:

```tsx
// Separador: → o /
className = 'flex items-center gap-2 text-sm text-gray-400';
```

---

#### BackButton

**Ubicación HTML**: Top-left de páginas internas  
**Componente React**: `apps/web-client/src/components/ui/BackButton.tsx`

```typescript
interface BackButtonProps {
  onClick?: () => void; // Default: router.back()
  label?: string; // Default: "Volver"
}

<BackButton label="Volver a campos" />
```

---

#### SemanticNavigation

**Ubicación HTML**: Sidebar o navegación lateral  
**Componente React**: `apps/web-client/src/components/features/SemanticNavigation.tsx`

```typescript
interface SemanticNavigationProps {
  currentLevel: 'campo' | 'subcampo' | 'microcampo';
  hierarchy: {
    campo?: { id: string; nombre: string };
    subcampo?: { id: string; nombre: string };
    microcampo?: { id: string; nombre: string };
  };
}
```

---

### 2. Visualización de Contenido

#### HierarchyTree

**Ubicación HTML**: Visualización de estructura semántica  
**Componente React**: `apps/web-client/src/components/features/HierarchyTree.tsx`

```typescript
interface HierarchyTreeProps {
  data: {
    campo: CampoSemantico;
    expanded?: boolean;
  };
  onNodeClick?: (level: string, id: string) => void;
}

// Visualización tipo árbol colapsable
<HierarchyTree
  data={campoData}
  onNodeClick={(level, id) => navigate(`/${level}/${id}`)}
/>
```

**Features esperadas**:

- Expansión/colapso de nodos
- Highlight del nodo actual
- Animaciones smooth
- Iconos por nivel

---

#### CardList

**Ubicación HTML**: Listas de campos, subcampos, microcampos  
**Componente React**: `apps/web-client/src/components/ui/CardList.tsx`

```typescript
interface CardListProps<T> {
  items: T[];
  renderCard: (item: T) => React.ReactNode;
  columns?: 1 | 2 | 3 | 4; // Responsive grid
  gap?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  emptyMessage?: string;
}

<CardList
  items={subcampos}
  renderCard={(subcampo) => <SubcampoCard data={subcampo} />}
  columns={3}
  gap="md"
/>
```

---

#### FieldCard / SubcampoCard / MicrocampoCard

**Ubicación HTML**: Tarjetas individuales en listas  
**Componente React**: `apps/web-client/src/components/features/semantic/[Field|Subcampo|Microcampo]Card.tsx`

```typescript
interface FieldCardProps {
  data: CampoSemantico | Subcampo | Microcampo;
  onClick?: () => void;
  variant?: 'default' | 'compact' | 'detailed';
}

// Campo Semántico
<FieldCard
  data={campo}
  variant="detailed"
  onClick={() => navigate(`/campo-semantico/${campo.id}`)}
/>
```

**Elementos visuales**:

- Imagen de fondo/icono (opcional)
- Nombre en español (principal)
- Nombre en namtrik (secundario)
- Descripción corta
- Badge de cantidad (subcampos/microcampos/palabras)
- Hover effect + animación

---

#### WordCard

**Ubicación HTML**: Tarjeta de palabra en lista  
**Componente React**: `apps/web-client/src/components/features/dictionary/WordCard.tsx`

```typescript
interface WordCardProps {
  word: Palabra;
  showAudio?: boolean;
  showImage?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'compact' | 'detailed';
}

<WordCard
  word={palabra}
  showAudio={true}
  onClick={() => openWordModal(palabra.id)}
/>
```

**Elementos**:

- Término en namtrik (destacado)
- Traducción en español
- Botón de audio (play icon)
- Imagen thumbnail (opcional)
- Tags de categorías
- Icono de favorito (futuro)

---

### 3. Búsqueda y Filtros

#### SearchBar

**Ubicación HTML**: Header de páginas de listado  
**Componente React**: `apps/web-client/src/components/ui/SearchBar.tsx` (ya existe, puede necesitar actualizarse)

```typescript
interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  debounceMs?: number; // Default: 300
  value?: string;
  loading?: boolean;
}

<SearchBar
  placeholder="Buscar palabras en namtrik o español..."
  onSearch={handleSearch}
  loading={isSearching}
/>
```

**Features**:

- Debounce automático
- Clear button (X)
- Loading spinner integrado
- Keyboard shortcuts (Ctrl+K)

---

#### LanguageFilter

**Ubicación HTML**: Filtros en página de palabras  
**Componente React**: `apps/web-client/src/components/features/dictionary/LanguageFilter.tsx`

```typescript
interface LanguageFilterProps {
  value: 'todos' | 'namtrik' | 'espanol';
  onChange: (value: string) => void;
}

<LanguageFilter
  value={language}
  onChange={setLanguage}
/>
```

**Diseño**: Radio buttons o toggle buttons estilizados

---

#### Pagination

**Ubicación HTML**: Bottom de listas largas  
**Componente React**: `apps/web-client/src/components/ui/Pagination.tsx`

```typescript
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  maxVisible?: number; // Default: 5
}

<Pagination
  currentPage={page}
  totalPages={Math.ceil(total / pageSize)}
  onPageChange={setPage}
/>
```

---

### 4. Multimedia

#### AudioPlayer

**Ubicación HTML**: En WordCard y detalle de palabra  
**Componente React**: `apps/web-client/src/components/features/multimedia/AudioPlayer.tsx`

```typescript
interface AudioPlayerProps {
  src: string;
  autoPlay?: boolean;
  showWaveform?: boolean;
  variant?: 'button' | 'inline' | 'full';
}

// Variant "button": Solo icono play
<AudioPlayer src={audioUrl} variant="button" />

// Variant "full": Player completo con controles
<AudioPlayer src={audioUrl} variant="full" showWaveform />
```

**Features**:

- Play/pause
- Loading state
- Error handling
- Waveform visualization (opcional)
- Progress bar

---

#### ImageGallery

**Ubicación HTML**: En detalle de palabra o campo semántico  
**Componente React**: `apps/web-client/src/components/features/multimedia/ImageGallery.tsx`

```typescript
interface ImageGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    caption?: string;
  }>;
  columns?: number;
  lightbox?: boolean;
}

<ImageGallery
  images={culturalImages}
  columns={3}
  lightbox={true}
/>
```

---

### 5. Estados y Feedback

#### LoadingSpinner

**Ubicación HTML**: Estados de carga  
**Componente React**: `apps/web-client/src/components/ui/LoadingScreen.tsx` (ya existe)

```typescript
// Ya implementado, reutilizar
import { LoadingScreen } from '@/components/ui/LoadingScreen';

<LoadingScreen />
```

---

#### Skeleton

**Ubicación HTML**: Loading placeholders  
**Componente React**: `apps/web-client/src/components/ui/Skeleton.tsx` (ya existe)

```typescript
// Ya implementado, reutilizar para cards
<Skeleton variant="rectangular" width="100%" height={200} />
```

---

#### EmptyState

**Ubicación HTML**: Cuando no hay resultados  
**Componente React**: `apps/web-client/src/components/ui/EmptyState.tsx` (crear)

```typescript
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

<EmptyState
  icon={<SearchIcon />}
  title="No se encontraron palabras"
  description="Intenta con otros términos de búsqueda"
  action={{ label: 'Ver todas', onClick: clearFilters }}
/>
```

---

#### ErrorFallback

**Ubicación HTML**: Estados de error  
**Componente React**: `apps/web-client/src/components/ui/ErrorFallback.tsx` (ya existe)

```typescript
// Ya implementado, reutilizar
<ErrorFallback error={error} resetError={retry} />
```

---

### 6. Modales y Overlays

#### WordDetailModal

**Ubicación HTML**: Modal de detalle de palabra  
**Componente React**: `apps/web-client/src/components/features/dictionary/WordDetailModal.tsx`

```typescript
interface WordDetailModalProps {
  wordId: string;
  isOpen: boolean;
  onClose: () => void;
}

<WordDetailModal
  wordId={selectedWordId}
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
/>
```

**Contenido**:

- Término completo (namtrik + español)
- Audio de pronunciación
- Imágenes culturales
- Descripción extendida
- Contexto de uso
- Campos semánticos relacionados
- Botones de compartir/favorito

---

## 🔄 Mapeo de Elementos HTML Comunes

### Botones

```html
<!-- HTML -->
<button class="btn btn-primary">Texto</button>

<!-- React -->
import { Button } from '@/components/ui/Button';
<button variant="primary">Texto</button>
```

### Links de navegación

```html
<!-- HTML -->
<a href="/ruta">Link</a>

<!-- React -->
import { Link } from 'react-router-dom';
<Link to="/ruta">Link</Link>
```

### Imágenes lazy

```html
<!-- HTML -->
<img loading="lazy" src="..." alt="..." />

<!-- React -->
import { LazyImage } from '@/components/ui/LazyImage';
<LazyImage src="..." alt="..." />
```

### Iconos

```html
<!-- HTML con SVG inline o FontAwesome -->
<i class="fa fa-arrow-left"></i>

<!-- React -->
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
<ArrowLeftIcon className="w-5 h-5" />
```

---

## 📦 Estructura de Componentes Sugerida

```
apps/web-client/src/components/
├── ui/                          # Componentes base reutilizables
│   ├── Button.tsx              ✅ Ya existe
│   ├── LazyImage.tsx           ✅ Ya existe
│   ├── Skeleton.tsx            ✅ Ya existe
│   ├── LoadingScreen.tsx       ✅ Ya existe
│   ├── ErrorFallback.tsx       ✅ Ya existe
│   ├── Breadcrumbs.tsx         🆕 Crear
│   ├── BackButton.tsx          🆕 Crear
│   ├── CardList.tsx            🆕 Crear
│   ├── SearchBar.tsx           🔄 Actualizar
│   ├── Pagination.tsx          🆕 Crear
│   └── EmptyState.tsx          🆕 Crear
│
├── features/                    # Componentes específicos del dominio
│   ├── semantic/               🆕 Crear directorio
│   │   ├── HierarchyTree.tsx
│   │   ├── SemanticNavigation.tsx
│   │   ├── FieldCard.tsx
│   │   ├── SubcampoCard.tsx
│   │   └── MicrocampoCard.tsx
│   │
│   ├── dictionary/             🆕 Crear directorio
│   │   ├── WordCard.tsx
│   │   ├── WordDetailModal.tsx
│   │   ├── LanguageFilter.tsx
│   │   └── WordsList.tsx
│   │
│   └── multimedia/             🆕 Crear directorio
│       ├── AudioPlayer.tsx
│       └── ImageGallery.tsx
│
├── layouts/
│   └── MainLayout.tsx          ✅ Ya existe
│
└── sections/
    └── ...                     ✅ Secciones existentes
```

---

## 🎯 Prioridad de Creación

### 🔴 Alta Prioridad (P1)

1. `Breadcrumbs` - Navegación esencial
2. `FieldCard` / `SubcampoCard` / `MicrocampoCard` - Visualización core
3. `SearchBar` (actualizar) - Funcionalidad clave
4. `EmptyState` - UX importante

### 🟡 Media Prioridad (P2)

5. `WordCard` - Visualización de palabras
6. `Pagination` - Listas largas
7. `LanguageFilter` - Filtrado básico
8. `HierarchyTree` - Visualización avanzada

### 🟢 Baja Prioridad (P3)

9. `AudioPlayer` - Multimedia
10. `ImageGallery` - Multimedia
11. `WordDetailModal` - Detalle avanzado
12. `SemanticNavigation` - Navegación avanzada

---

## 📝 Notas de Implementación

### Reutilizar componentes existentes

El proyecto ya tiene componentes UI sólidos:

- `Button` ✅
- `LazyImage` ✅
- `Skeleton` ✅
- `LoadingScreen` ✅
- `ErrorBoundary` ✅

**Importante**: Mantener el mismo estándar de calidad (testing 98.78% coverage)

### Testing de nuevos componentes

Cada componente nuevo debe incluir:

- Tests unitarios (mínimo 80% coverage)
- Tests de accesibilidad
- Tests de interacción
- Snapshots (opcional)

### Accesibilidad (WCAG 2.1 AA)

Todos los componentes deben:

- Tener ARIA labels apropiados
- Soportar navegación por teclado
- Tener contraste de color suficiente (>4.5:1)
- Funcionar con screen readers

---

**Última actualización**: 2025-10-23  
**Responsable**: Equipo de desarrollo Tumi-dev
