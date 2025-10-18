# 📋 Plan de Migración: Prototipo HTML → React

**Proyecto:** Diccionario Misak  
**Fecha:** 2025-10-04  
**Branch:** `feature/week1-setup`  
**Prototipo fuente:** `apps/index.html` (250 líneas)

---

## 🎯 Objetivo

Migrar el prototipo HTML estático a una aplicación React moderna, preservando:

- ✅ Diseño visual y UX
- ✅ Animaciones y transiciones
- ✅ Funcionalidad de scrollytelling
- ✅ Colores y estilos Misak

---

## 📊 Análisis del Prototipo HTML

### Estructura Identificada:

```
index.html (250 líneas)
├── Head (meta, fonts, tailwind CDN, styles)
├── Body
    └── Scrollytelling Container
        ├── Hero Section (landing)
        ├── Video Section (recorrido)
        ├── Info Section (territorio como metáfora)
        ├── Gallery Section (3 imágenes)
        └── Credits Section (créditos + contactos)
```

### Secciones Detalladas:

#### 1. **Hero Section** (líneas 90-136)

- **Contenido:**
  - Imagen de fondo: Territorio Misak
  - Título: "Diccionario Misak"
  - Hotspot interactivo (centro): "Campo semántico 1: Wallikatɵ"
  - Scroll indicator (flecha animada)
  - Gradient overlay
- **Características:**
  - Full viewport height
  - Scroll snap
  - Hotspot con hover tooltip
  - Link a #recorrido

#### 2. **Video Section** (líneas 137-149)

- **Contenido:**
  - iframe de YouTube
  - Video ID: `uGVUog2ZoAc`
  - Aspect ratio 16:9
- **Características:**
  - Max-width 4xl
  - Rounded corners
  - Shadow 2xl

#### 3. **Info Section** (líneas 150-166)

- **Contenido:**
  - Título: "El Territorio como Metáfora"
  - Párrafo descriptivo (4 oraciones)
- **Características:**
  - Max-width 4xl
  - Centrado
  - Color primary en título

#### 4. **Gallery Section** (líneas 167-200)

- **Contenido:**
  - 3 imágenes en grid
    1. "La espiral del tiempo"
    2. "Tejiendo el conocimiento"
    3. "Voces de la tierra"
- **Características:**
  - Grid responsive (1 col mobile, 3 cols desktop)
  - Hover scale effect (1.1x)
  - Overlay con texto
  - Rounded corners

#### 5. **Credits Section** (líneas 201-247)

- **Contenido:**
  - Título: "Créditos"
  - Cabildo Indígena info
  - Gobernadora y Vicegobernador
  - 4 emails de contacto
  - 3 íconos sociales (Facebook, Twitter, Instagram)
- **Características:**
  - Centrado
  - Divider decorativo
  - Social links con hover

---

## 🎨 Estilos Personalizados Identificados

### CSS Custom (líneas 13-86):

1. **Variables CSS:**

   ```css
   --primary-color: #38e07b --secondary-color: #264532 --text-color: #ffffff
     --background-color: #122118;
   ```

   ✅ **Ya migrado a Tailwind v4 @theme**

2. **Scrollytelling Container:**
   - height: 100vh
   - overflow-y: scroll
   - scroll-snap-type: y mandatory

3. **Scrollytelling Section:**
   - scroll-snap-align: start
   - height: 100vh
   - flex center

4. **Hotspot Styles:**
   - Circular (2rem)
   - Primary color con alpha
   - Hover: scale(1.2)
   - Tooltip on hover

5. **Section Backgrounds:**
   - Video, Info, Gallery, Credits: background-color

---

## 🏗️ Arquitectura de Componentes React

### Estructura de Carpetas Propuesta:

```
apps/web-client/src/
├── components/
│   ├── layouts/
│   │   └── MainLayout.tsx          # Layout principal con scrollytelling
│   │
│   ├── sections/
│   │   ├── HeroSection.tsx         # Landing con imagen + hotspot
│   │   ├── VideoSection.tsx        # Iframe YouTube
│   │   ├── InfoSection.tsx         # Texto descriptivo
│   │   ├── GallerySection.tsx      # Grid de imágenes
│   │   └── CreditsSection.tsx      # Créditos + contactos
│   │
│   └── features/
│       ├── scrollytelling/
│       │   ├── Hotspot.tsx         # Hotspot interactivo
│       │   └── ScrollIndicator.tsx # Flecha animada
│       │
│       └── social/
│           └── SocialLinks.tsx     # Íconos sociales
│
├── pages/
│   └── Home.tsx                    # Página principal (orquestador)
│
└── types/
    └── scrollytelling.ts           # TypeScript types
```

---

## 📋 Roadmap de Implementación

### Sprint 1: Estructura Base (1-2 horas) ✅

**Tareas:**

1. ✅ Crear estructura de carpetas
2. ✅ Crear `MainLayout.tsx` con scrollytelling container
3. ✅ Crear `Home.tsx` como orquestador
4. ✅ Configurar CSS scrollytelling en index.css

**Componentes:**

- `MainLayout` (wrapper con scroll snap)
- `Home` (página principal)

---

### Sprint 2: Secciones Principales (2-3 horas)

**Tareas:**

1. Crear `HeroSection` con imagen de fondo
2. Crear `VideoSection` con iframe
3. Crear `InfoSection` con texto
4. Integrar secciones en Home

**Componentes:**

- `HeroSection`
- `VideoSection`
- `InfoSection`

---

### Sprint 3: Galería y Créditos (1-2 horas)

**Tareas:**

1. Crear `GallerySection` con grid
2. Crear `CreditsSection` con info
3. Crear componente `SocialLinks`

**Componentes:**

- `GallerySection`
- `CreditsSection`
- `SocialLinks`

---

### Sprint 4: Features Interactivas (2-3 horas)

**Tareas:**

1. Crear componente `Hotspot`
2. Crear componente `ScrollIndicator`
3. Implementar animaciones con Framer Motion
4. Implementar smooth scroll behavior

**Componentes:**

- `Hotspot` (interactivo con tooltip)
- `ScrollIndicator` (animated arrow)

---

### Sprint 5: Testing y Validación (1-2 horas)

**Tareas:**

1. Tests unitarios para cada componente
2. Validar responsive design
3. Optimizar performance
4. Documentar componentes

**Deliverables:**

- Tests para todas las secciones
- Responsive validado
- Performance optimizado

---

## 🎯 Componentes Prioritarios

### Alta Prioridad:

1. ✅ MainLayout (base)
2. ✅ HeroSection (primera impresión)
3. ✅ VideoSection (contenido clave)

### Media Prioridad:

4. InfoSection (contexto)
5. GallerySection (visual)

### Baja Prioridad:

6. CreditsSection (footer)
7. SocialLinks (extras)
8. Hotspot avanzado (nice-to-have)

---

## 🔄 Decisiones de Migración

### ✅ Mantener:

- Diseño visual exacto
- Colores Misak
- Estructura de secciones
- Funcionalidad scrollytelling
- Animaciones de hover

### ⚡ Mejorar:

- TypeScript types
- Component reusability
- Performance (lazy loading images)
- Accessibility (semantic HTML, ARIA labels)
- SEO (meta tags, structured data)

### 🚫 Eliminar:

- Tailwind CDN (ya tenemos v4 local)
- Inline styles (migrar a Tailwind classes)
- IDs para navegación (usar React Router hash links)

---

## 📦 Dependencias Necesarias

### Ya Instaladas ✅:

- React 19.1.1
- Tailwind CSS 4.1.13
- Framer Motion 12.23.19
- TypeScript 5.9.2

### Por Instalar:

- `react-scroll` o implementación custom
- `react-player` (opcional, para mejor control del video)

---

## 🎨 Animaciones con Framer Motion

### Identificadas en el Prototipo:

1. **Scroll Indicator (bounce):**

   ```tsx
   animate={{ y: [0, 10, 0] }}
   transition={{ repeat: Infinity, duration: 2 }}
   ```

2. **Hotspot Hover (scale):**

   ```tsx
   whileHover={{ scale: 1.2 }}
   transition={{ duration: 0.3 }}
   ```

3. **Gallery Images (scale):**

   ```tsx
   whileHover={{ scale: 1.1 }}
   transition={{ duration: 0.5 }}
   ```

4. **Section Entry (fade + slide):**
   ```tsx
   initial={{ opacity: 0, y: 50 }}
   whileInView={{ opacity: 1, y: 0 }}
   transition={{ duration: 0.8 }}
   ```

---

## ✅ Checklist de Validación

### Funcionalidad:

- [ ] Scroll snapping funciona correctamente
- [ ] Todas las secciones son visibles
- [ ] Hotspot interactivo con tooltip
- [ ] Video se reproduce correctamente
- [ ] Gallery hover effects funcionan
- [ ] Social links apuntan a URLs correctas
- [ ] Responsive en mobile/tablet/desktop

### Performance:

- [ ] Lazy loading de imágenes
- [ ] Optimización de bundle size
- [ ] No hay rerenders innecesarios
- [ ] Smooth scroll sin lag

### Accesibilidad:

- [ ] Semantic HTML tags
- [ ] ARIA labels donde sea necesario
- [ ] Keyboard navigation
- [ ] Screen reader friendly

### Testing:

- [ ] Tests unitarios para cada componente
- [ ] Tests de integración para Home
- [ ] Visual regression tests
- [ ] E2E test de scroll flow

---

## 📝 Notas Importantes

### URLs de Assets:

**Imágenes de Google (del prototipo):**

- Hero: `https://lh3.googleusercontent.com/aida-public/AB6AXuBSdhbf...`
- Gallery 1: `https://lh3.googleusercontent.com/aida-public/AB6AXuDvjn9O...`
- Gallery 2: `https://lh3.googleusercontent.com/aida-public/AB6AXuA-J9XI...`
- Gallery 3: `https://lh3.googleusercontent.com/aida-public/AB6AXuDJTM1I...`

**Video YouTube:**

- ID: `uGVUog2ZoAc`
- Start time: 6 seconds
- Options: autoplay=0, controls=1, modestbranding=1, rel=0

⚠️ **TODO:** Considerar hospedar imágenes localmente para mejor performance y control.

---

## 🚀 Siguiente Acción

**Comenzar Sprint 1:** Crear estructura de carpetas y MainLayout

```bash
# Crear estructura
mkdir -p apps/web-client/src/components/{layouts,sections,features/{scrollytelling,social}}
mkdir -p apps/web-client/src/pages
mkdir -p apps/web-client/src/types

# Crear archivos base
touch apps/web-client/src/components/layouts/MainLayout.tsx
touch apps/web-client/src/pages/Home.tsx
touch apps/web-client/src/types/scrollytelling.ts
```

---

**Autor:** AI Assistant + TumiDev  
**Versión:** 1.0  
**Estado:** ✅ Plan Aprobado - Ready to Implement
