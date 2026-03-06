# Prototipos HTML - Diccionario Misak

## 📋 Propósito

Este directorio contiene los prototipos HTML de las nuevas páginas del proyecto antes de ser migrados a React. Sirve como:

1. **Referencia visual** para el diseño y UX
2. **Especificación funcional** para los componentes React
3. **Documentación** del proceso de migración
4. **Testing manual** previo a la implementación en React

---

## 📁 Estructura de Directorios

```
prototypes/
├── current/                 # Prototipos HTML actuales
│   ├── index.html          # Homepage actualizado
│   ├── semantic-field.html # Página de campo semántico
│   ├── subfield.html       # Página de subcampo
│   ├── microfield.html     # Página de microcampo
│   └── words-list.html     # Lista de palabras del microcampo
│
├── assets/                  # Assets de los prototipos
│   ├── css/                # Estilos específicos
│   ├── js/                 # Scripts de interacción
│   └── images/             # Imágenes de prueba
│
├── migration-notes/         # Documentación de migración
│   ├── components-mapping.md
│   ├── routes-structure.md
│   └── data-flow.md
│
└── README.md               # Este archivo
```

---

## 🚀 Workflow de Migración

### Fase 1: Preparación (Actual)

- [ ] Colocar prototipos HTML en `current/`
- [ ] Documentar estructura de rutas
- [ ] Identificar componentes reutilizables
- [ ] Mapear assets necesarios

### Fase 2: Análisis

- [ ] Analizar interacciones y animaciones
- [ ] Identificar estados de UI
- [ ] Definir props de componentes React
- [ ] Planificar integración con backend API

### Fase 3: Migración a React

- [ ] Crear páginas base en `apps/web-client/src/pages/`
- [ ] Migrar componentes a `apps/web-client/src/components/`
- [ ] Integrar con React Router
- [ ] Implementar data fetching con React Query
- [ ] Aplicar TailwindCSS para estilos

### Fase 4: Testing

- [ ] Tests unitarios para componentes
- [ ] Tests de integración para páginas
- [ ] Validación de accesibilidad (WCAG 2.1 AA)
- [ ] Performance testing

### Fase 5: Documentación

- [ ] Actualizar CHANGELOG.md
- [ ] Documentar decisiones de diseño
- [ ] Crear guías de uso
- [ ] Archivar prototipos originales

---

## 📝 Páginas a Migrar

### 1. index.html (Homepage) - Actualización

**Ruta React**: `/`  
**Componente**: `apps/web-client/src/pages/Home.tsx` (actualizar)  
**Estado**: Existente, requiere actualizaciones

**Cambios esperados**:

- Integración con datos reales del backend
- Navegación mejorada a campos semánticos
- Animaciones y transiciones actualizadas

---

### 2. semantic-field.html

**Ruta React**: `/campo-semantico/:id`  
**Componente**: `apps/web-client/src/pages/SemanticField.tsx` (nuevo)  
**Estado**: Pendiente migración

**Features esperadas**:

- Visualización del campo semántico seleccionado
- Lista de subcampos disponibles
- Breadcrumbs de navegación
- Información contextual del campo
- Imágenes/multimedia relacionadas

**Data Requirements**:

```typescript
interface SemanticFieldPageProps {
  field: {
    id: string;
    nombre_espanol: string;
    nombre_namtrik?: string;
    descripcion?: string;
    subcampos: Subcampo[];
  };
}
```

---

### 3. subfield.html

**Ruta React**: `/campo-semantico/:fieldId/subcampo/:subId`  
**Componente**: `apps/web-client/src/pages/Subfield.tsx` (nuevo)  
**Estado**: Pendiente migración

**Features esperadas**:

- Visualización del subcampo
- Lista de microcampos
- Jerarquía visual (Campo > Subcampo)
- Navegación entre subcampos
- Información contextual

**Data Requirements**:

```typescript
interface SubfieldPageProps {
  subfield: {
    id: string;
    nombre_espanol: string;
    nombre_namtrik?: string;
    microcampos: Microcampo[];
    campoSemanticoId: string;
  };
}
```

---

### 4. microfield.html

**Ruta React**: `/campo-semantico/:fieldId/subcampo/:subId/microcampo/:microId`  
**Componente**: `apps/web-client/src/pages/Microfield.tsx` (nuevo)  
**Estado**: Pendiente migración

**Features esperadas**:

- Visualización del microcampo
- Lista de palabras (preview)
- Jerarquía completa (Campo > Subcampo > Microcampo)
- Acceso rápido a palabras
- Filtros y búsqueda

**Data Requirements**:

```typescript
interface MicrofieldPageProps {
  microfield: {
    id: string;
    nombre_espanol: string;
    nombre_namtrik?: string;
    palabras: Palabra[];
    subcampoId: string;
  };
}
```

---

### 5. words-list.html

**Ruta React**: `/microcampo/:microId/palabras`  
**Componente**: `apps/web-client/src/pages/WordsList.tsx` (nuevo)  
**Estado**: Pendiente migración

**Features esperadas**:

- Lista completa de palabras del microcampo
- Filtros por idioma (Namtrik/Español)
- Búsqueda en tiempo real
- Paginación
- Vista de tarjetas o lista
- Modal de detalle de palabra
- Audio de pronunciación
- Imágenes asociadas

**Data Requirements**:

```typescript
interface WordsListPageProps {
  words: Palabra[];
  microcampo: Microcampo;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
  filters: {
    idioma?: 'namtrik' | 'espanol';
    search?: string;
  };
}
```

---

## 🔗 Integración con Backend API

Cada página migrará usando estos endpoints del backend:

```typescript
// Campo Semántico
GET /api/dictionary/semantic-fields/:id
GET /api/dictionary/semantic-fields/:id/subcampos

// Subcampo
GET /api/dictionary/subcampos/:id
GET /api/dictionary/subcampos/:id/microcampos

// Microcampo
GET /api/dictionary/microcampos/:id
GET /api/dictionary/microcampos/:id/words

// Palabras
GET /api/dictionary/words
GET /api/dictionary/words/:id
GET /api/dictionary/words/search?term=...
```

---

## 🎨 Componentes Comunes a Extraer

### Navegación

- `<Breadcrumbs />` - Navegación jerárquica
- `<SemanticNavigation />` - Navegación entre niveles
- `<BackButton />` - Botón de regreso

### Visualización

- `<HierarchyTree />` - Árbol de jerarquía semántica
- `<CardList />` - Lista de tarjetas (campos, palabras)
- `<WordCard />` - Tarjeta de palabra individual

### Filtros y Búsqueda

- `<SearchBar />` - Barra de búsqueda reutilizable
- `<LanguageFilter />` - Filtro de idioma
- `<Pagination />` - Paginación

### Multimedia

- `<AudioPlayer />` - Reproductor de pronunciaciones
- `<ImageGallery />` - Galería de imágenes culturales
- `<VideoEmbed />` - Videos embebidos

---

## 📐 Estructura de Rutas (React Router)

```typescript
// apps/web-client/src/App.tsx
const routes = [
  {
    path: '/',
    element: <Home />
  },
  {
    path: '/campo-semantico/:fieldId',
    element: <SemanticField />
  },
  {
    path: '/campo-semantico/:fieldId/subcampo/:subId',
    element: <Subfield />
  },
  {
    path: '/campo-semantico/:fieldId/subcampo/:subId/microcampo/:microId',
    element: <Microfield />
  },
  {
    path: '/microcampo/:microId/palabras',
    element: <WordsList />
  },
  // ... otras rutas
];
```

---

## ✅ Checklist de Migración por Página

Para cada prototipo HTML, seguir estos pasos:

### 1. Análisis Previo

- [ ] Revisar estructura HTML y clases CSS
- [ ] Identificar elementos interactivos (botones, links, forms)
- [ ] Documentar animaciones y transiciones
- [ ] Listar assets necesarios (imágenes, fuentes, iconos)
- [ ] Definir estados de UI (loading, error, empty)

### 2. Planificación

- [ ] Crear issue en GitHub (si aplica)
- [ ] Definir componentes necesarios
- [ ] Planificar integración con API
- [ ] Estimar tiempo de migración
- [ ] Asignar prioridad

### 3. Implementación

- [ ] Crear componente React base
- [ ] Migrar estructura HTML a JSX
- [ ] Convertir CSS a TailwindCSS
- [ ] Implementar lógica de interacción
- [ ] Integrar con React Query
- [ ] Añadir loading/error states
- [ ] Implementar lazy loading (si aplica)

### 4. Testing

- [ ] Tests unitarios (componentes)
- [ ] Tests de integración (página completa)
- [ ] Validar accesibilidad (a11y)
- [ ] Verificar responsive design
- [ ] Probar en múltiples navegadores

### 5. Documentación

- [ ] Documentar props y types
- [ ] Añadir comentarios en código complejo
- [ ] Actualizar documentación del proyecto
- [ ] Crear ejemplos de uso (Storybook futuro)

---

## 🔧 Herramientas Útiles

### Conversión HTML → JSX

```bash
# Herramienta online recomendada
https://transform.tools/html-to-jsx
```

### Análisis de CSS

```bash
# Ver clases CSS usadas en prototipo
grep -r "class=" current/*.html | sort | uniq
```

### Extracción de Assets

```bash
# Copiar assets necesarios a web-client
cp -r assets/images/* ../web-client/public/images/
```

---

## 📊 Estado de Migración

| Página                     | Prototipo | Análisis | Migración | Testing | Completado |
| -------------------------- | --------- | -------- | --------- | ------- | ---------- |
| index.html (actualización) | ✅        | ⏳       | ⏳        | ⏳      | 0%         |
| semantic-field.html        | ⏳        | ⏳       | ⏳        | ⏳      | 0%         |
| subfield.html              | ⏳        | ⏳       | ⏳        | ⏳      | 0%         |
| microfield.html            | ⏳        | ⏳       | ⏳        | ⏳      | 0%         |
| words-list.html            | ⏳        | ⏳       | ⏳        | ⏳      | 0%         |

**Leyenda**: ✅ Completo | 🔄 En progreso | ⏳ Pendiente | ❌ Bloqueado

---

## 📞 Contacto y Soporte

Para preguntas sobre el proceso de migración:

- Revisar `docs/project.md` - Documentación master
- Consultar `docs/CURRENT-STATE.md` - Estado actual
- Revisar código existente en `apps/web-client/src/`

---

## 🎯 Próximos Pasos Inmediatos

1. **Colocar prototipos HTML** en `apps/prototypes/current/`
2. **Revisar y documentar** estructura de cada prototipo
3. **Crear issues/tasks** para cada página a migrar
4. **Priorizar migración** según flujo de usuario
5. **Comenzar con página más simple** (probablemente semantic-field.html)

---

**Última actualización**: 2025-10-23  
**Versión**: v0.3.0-alpha  
**Responsable**: Equipo de desarrollo Tumi-dev
