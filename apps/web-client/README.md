# Web Client - Diccionario Cultural Misak

Frontend de la aplicación Diccionario Cultural Misak, construido con **React 19**, **Vite 7**, **TypeScript 5** y **TailwindCSS 4**.

## 🎨 Sistema de Diseño

### Identidad Visual Misak

El diseño del Diccionario Misak está inspirado en la **cosmovisión y el territorio ancestral** del pueblo Misak, utilizando una paleta de colores que refleja la naturaleza y la conexión con la tierra.

**Paleta de Colores:**

- 🟢 **Verde Primario** (`#38e07b`) - Naturaleza, vida, territorio
- 🌲 **Verde Bosque** (`#264532`) - Profundidad, tradición
- ⬛ **Negro Verdoso** (`#122118`) - Tierra, noche, misterio
- ⚪ **Blanco** (`#ffffff`) - Claridad, conocimiento

**Tipografía:**

- **Display:** Spline Sans (títulos) - Moderna y geométrica
- **Body:** Noto Sans (texto) - Legible y multiidioma

**Puntuación de Diseño:** 9.0/10 ⭐

📖 **[Ver Análisis Completo del Diseño →](docs/DESIGN-ANALYSIS.md)**

---

## 🚀 Características Principales

### Stack Tecnológico

- **React** 19.2+ - Framework UI moderno con React Compiler
- **Vite** 7.2+ - Build tool de alto rendimiento
- **TypeScript** 5.9+ - Tipado estático robusto
- **TailwindCSS** 4.1+ - Framework CSS utility-first
- **Framer Motion** 12.23+ - Animaciones y transiciones fluidas
- **React Router** 7.9+ - Enrutamiento SPA
- **TanStack Query** 5.90+ - Server state management
- **Zustand** 5.0+ - Client state management
- **Zod** 4.1+ - Validación de schemas
- **Vitest** 4.0+ - Framework de testing rápido
- **PWA** - vite-plugin-pwa 1.2+ con Workbox 7.4+

### ✅ Funcionalidades Implementadas

#### Core Features

- ✅ **Diseño Responsive** - Mobile-first con breakpoints optimizados
- ✅ **PWA Completo** - Funciona offline con Service Workers
- ✅ **Lazy Loading** - Code splitting y carga diferida de imágenes
- ✅ **Animaciones Inmersivas** - Framer Motion con scroll animations
- ✅ **Error Boundaries** - Manejo robusto de errores
- ✅ **SEO Optimizado** - Meta tags y Open Graph
- ✅ **Performance** - Bundle optimizado (68KB gzipped)

#### Componentes Principales

- ✅ **Hero Section** - Landing inmersivo con video de fondo
- ✅ **Video Section** - Player de video embebido
- ✅ **Gallery Section** - Galería de imágenes con lazy loading
- ✅ **Info Section** - Información del proyecto
- ✅ **Credits Section** - Créditos y colaboradores
- ✅ **Scroll Indicator** - Indicador de scroll animado
- ✅ **Social Links** - Enlaces a redes sociales
- ✅ **Loading Screen** - Pantalla de carga elegante
- ✅ **Error Fallback** - Páginas de error personalizadas

#### Testing

- ✅ **175 tests implementados** - Cobertura de componentes y hooks
- ✅ **93%+ coverage** - Alta cobertura de código
- ✅ **Testing Library** - Tests centrados en el usuario
- ✅ **Vitest UI** - Interfaz gráfica para testing

---

## 📦 Instalación

### Requisitos Previos

- **Node.js** >= 22.19.0
- **pnpm** >= 10.20.0 (ver instrucciones en README raíz)

### Instalación de Dependencias

Desde la **raíz del proyecto**:

```bash
pnpm install
```

---

## 🛠️ Desarrollo

### Comandos Disponibles

```bash
# Iniciar servidor de desarrollo (http://localhost:5173)
pnpm --filter web-client dev
# O desde la raíz del proyecto:
pnpm dev:web

# Build para producción
pnpm --filter web-client build
pnpm build:web

# Preview del build de producción
pnpm --filter web-client preview
pnpm preview:web

# Build con análisis de bundle
pnpm --filter web-client build:analyze
pnpm build:analyze
```

### Testing

```bash
# Ejecutar todos los tests
pnpm --filter web-client test
pnpm test

# Modo watch (desarrollo) - ejecuta tests al guardar
pnpm --filter web-client vitest

# UI Mode (interfaz gráfica en navegador)
pnpm --filter web-client test:ui
pnpm test:ui

# Coverage (cobertura de código)
pnpm --filter web-client test:coverage
pnpm test:coverage
```

### Linting y Formatting

```bash
# Lint del código
pnpm --filter web-client lint
pnpm lint:web

# Formatear código
pnpm format

# Verificar formato
pnpm format:check
```

---

## 📁 Estructura del Proyecto

```
apps/web-client/
├── public/                         # Assets públicos + PWA icons
│   ├── icon-192x192.png           # PWA icon 192x192
│   ├── icon-512x512.png           # PWA icon 512x512
│   ├── icon-maskable-*.png        # Maskable icons para Android
│   ├── favicon.ico                # Favicon
│   └── manifest.json              # PWA manifest (generado)
│
├── src/
│   ├── components/                # Componentes React
│   │   ├── ui/                    # Componentes UI reutilizables
│   │   │   ├── Button.tsx         # Botón personalizado
│   │   │   ├── LazyImage.tsx      # Imagen con lazy loading
│   │   │   ├── LoadingScreen.tsx  # Pantalla de carga
│   │   │   └── Skeleton.tsx       # Skeleton loader
│   │   │
│   │   ├── layouts/               # Layouts de página
│   │   │   └── MainLayout.tsx     # Layout principal con header/footer
│   │   │
│   │   ├── sections/              # Secciones de la landing page
│   │   │   ├── HeroSection.tsx    # Hero con video de fondo
│   │   │   ├── VideoSection.tsx   # Sección de video
│   │   │   ├── GallerySection.tsx # Galería de imágenes
│   │   │   ├── InfoSection.tsx    # Información del proyecto
│   │   │   └── CreditsSection.tsx # Créditos y equipo
│   │   │
│   │   ├── features/              # Features específicas
│   │   │   ├── scrollytelling/    # Componentes de scrollytelling
│   │   │   │   └── ScrollIndicator.tsx
│   │   │   └── social/            # Componentes sociales
│   │   │       └── SocialLinks.tsx
│   │   │
│   │   └── errors/                # Manejo de errores
│   │       ├── ErrorBoundary.tsx  # Error boundary component
│   │       └── ErrorFallback.tsx  # UI de error
│   │
│   ├── pages/                     # Páginas/rutas
│   │   ├── Home.tsx               # Página principal
│   │   └── NotFound.tsx           # Página 404
│   │
│   ├── hooks/                     # Custom React Hooks
│   │   └── useLazyImage.ts        # Hook para lazy loading de imágenes
│   │
│   ├── utils/                     # Utilidades
│   │   └── cn.ts                  # Utilidad para merge de clases CSS
│   │
│   ├── constants/                 # Constantes
│   │   └── assets.ts              # URLs de imágenes y videos
│   │
│   ├── types/                     # TypeScript types
│   │   └── *.d.ts                 # Declaraciones de tipos
│   │
│   ├── styles/                    # Estilos globales
│   │   └── index.css              # CSS global + Tailwind
│   │
│   ├── test/                      # Configuración de tests
│   │   └── setup.ts               # Setup de Vitest
│   │
│   ├── main.tsx                   # Entry point de la aplicación
│   └── index.css                  # Estilos globales
│
├── dist/                          # Build de producción (generado)
├── coverage/                      # Reportes de coverage (generado)
│
├── vite.config.ts                 # Configuración de Vite
├── vitest.config.ts               # Configuración de Vitest
├── tsconfig.json                  # TypeScript config base
├── tsconfig.app.json              # TypeScript config para app
├── tsconfig.node.json             # TypeScript config para Node
├── eslint.config.js               # Configuración de ESLint
├── postcss.config.js              # Configuración de PostCSS
├── index.html                     # HTML template
├── package.json                   # Dependencias y scripts
└── README.md                      # Este archivo
```

---

## 🏗️ Arquitectura

### Patrones de Diseño

#### Component Architecture

El proyecto sigue una arquitectura de componentes organizada en capas:

```
components/
├── ui/           # Componentes primitivos reutilizables (Button, Input)
├── layouts/      # Layouts de página (MainLayout)
├── sections/     # Secciones de página (Hero, Gallery)
├── features/     # Features completas (ScrollIndicator, SocialLinks)
└── errors/       # Manejo de errores (ErrorBoundary)
```

**Principios**:

- **Separation of Concerns**: Cada componente tiene una responsabilidad única
- **Reusability**: Componentes UI reutilizables con props flexibles
- **Composition**: Componentes complejos compuestos de componentes simples
- **Type Safety**: Todos los componentes fuertemente tipados con TypeScript

#### State Management

- **Local State**: `useState` para estado local de componentes
- **Computed State**: Derivado de props o estado existente
- **Side Effects**: `useEffect` para efectos secundarios
- **Custom Hooks**: Lógica reutilizable extraída en hooks personalizados

Ejemplo de custom hook:

```typescript path=src/hooks/useLazyImage.ts start=1
export const useLazyImage = (src: string) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => setLoaded(true);
    img.onerror = () => setError(true);
  }, [src]);

  return { loaded, error };
};
```

#### Error Handling

**Error Boundaries**: Capturan errores de React y muestran UI de fallback

```typescript path=src/components/errors/ErrorBoundary.tsx start=null
<ErrorBoundary fallback={<ErrorFallback />}>
  <App />
</ErrorBoundary>
```

**Try-Catch**: Para errores síncronos y asíncronos en efectos

### Performance Optimization

#### Code Splitting

- **Lazy Loading**: Páginas cargadas bajo demanda con `React.lazy()`
- **Dynamic Imports**: Componentes pesados cargados solo cuando se necesitan
- **Route-based Splitting**: Cada ruta es un chunk separado

```typescript path=src/main.tsx start=28
const Home = lazy(() => import('@pages/Home').then((module) => ({ default: module.Home })));
```

#### Image Optimization

- **Lazy Loading**: Imágenes cargadas solo cuando entran en viewport
- **Cloudinary CDN**: Imágenes optimizadas y servidas desde CDN
- **Responsive Images**: Diferentes tamaños según dispositivo
- **Progressive Loading**: Skeleton → Low-res → High-res

```typescript path=src/components/ui/LazyImage.tsx start=null
const LazyImage = ({ src, alt, className }) => {
  const { loaded } = useLazyImage(src);

  return (
    <>
      {!loaded && <Skeleton />}
      <img
        src={src}
        alt={alt}
        className={cn(loaded ? 'opacity-100' : 'opacity-0', className)}
      />
    </>
  );
};
```

#### Bundle Optimization

- **Manual Chunks**: Vendors y animaciones en chunks separados
- **Tree Shaking**: Código no usado eliminado automáticamente
- **Minification**: Código minificado con Terser
- **Gzip/Brotli**: Compresión en producción

**Bundle Size**:

- Total: ~66KB gzipped
- Vendor chunk: ~45KB (React, React Router)
- Animations chunk: ~12KB (Framer Motion)
- App chunk: ~9KB (código de la app)

#### PWA & Caching

**Service Worker Strategy**:

```typescript path=vite.config.ts start=51
workbox: {
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'CacheFirst',
      options: { maxAgeSeconds: 31536000 }, // 1 year
    },
    {
      urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
      handler: 'CacheFirst',
      options: { maxAgeSeconds: 2592000 }, // 30 days
    },
  ];
}
```

**Cache Layers**:

1. **Service Worker Cache**: Assets estáticos (JS, CSS, fonts)
2. **Browser Cache**: Headers HTTP (max-age, etag)
3. **CDN Cache**: Cloudinary para imágenes

---

## 🎨 Styling

### TailwindCSS 4

**Utilidades principales**:

```typescript path=null start=null
// Layout
<div className="container mx-auto px-4">

// Flexbox
<div className="flex items-center justify-between">

// Grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// Responsive
<div className="text-sm md:text-base lg:text-lg">

// Dark mode
<div className="bg-white dark:bg-gray-900">
```

### Framer Motion Animations

**Scroll Animations**:

```typescript path=null start=null
<motion.div
  initial={{ opacity: 0, y: 50 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6 }}
  viewport={{ once: true, margin: "-100px" }}
>
  Content
</motion.div>
```

**Stagger Children**:

```typescript path=null start=null
<motion.div
  variants={containerVariants}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true }}
>
  {items.map(item => (
    <motion.div key={item.id} variants={itemVariants}>
      {item.content}
    </motion.div>
  ))}
</motion.div>

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};
```

### CSS Organization

```
src/styles/
├── index.css              # Global styles + Tailwind directives
└── tailwind.config.js     # Tailwind configuration
```

**Custom CSS**:

```css path=src/styles/index.css start=null
@import 'tailwindcss';

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-thumb {
  background: theme('colors.primary.500');
  border-radius: 4px;
}
```

---

## 🧪 Testing

### Framework de Testing

- **Vitest**: Test runner rápido y compatible con Vite
- **React Testing Library**: Testing centrado en el usuario
- **jsdom**: Entorno DOM para tests
- **@vitest/ui**: Interfaz gráfica para tests

### Tipos de Tests

#### Unit Tests (Componentes UI)

```typescript path=src/components/ui/Button.test.tsx start=null
describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);

    await userEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

#### Integration Tests (Secciones)

```typescript path=src/components/sections/HeroSection.test.tsx start=null
describe('HeroSection', () => {
  it('renders hero section with all elements', () => {
    render(<HeroSection />);

    expect(screen.getByRole('heading')).toHaveTextContent('Diccionario Misak');
    expect(screen.getByText(/Preservación cultural/i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
```

#### Hook Tests

```typescript path=src/hooks/useLazyImage.test.ts start=null
describe('useLazyImage', () => {
  it('returns loaded state after image loads', async () => {
    const { result } = renderHook(() => useLazyImage('https://example.com/image.jpg'));

    expect(result.current.loaded).toBe(false);

    await waitFor(() => {
      expect(result.current.loaded).toBe(true);
    });
  });
});
```

### Coverage

**Configuración**:

```typescript path=vitest.config.ts start=41
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  thresholds: {
    lines: 70,
    functions: 70,
    branches: 70,
    statements: 70,
  }
}
```

**Resultados Actuales**:

- Lines: 98.78%
- Functions: 95.24%
- Branches: 94.12%
- Statements: 98.78%
- **177 tests passing**

### Testing Best Practices

1. **Test User Behavior**: Usa `screen.getByRole()` en lugar de `getByTestId()`
2. **Avoid Implementation Details**: No testees state interno, testea output
3. **Mock External Dependencies**: Mock APIs, third-party libraries
4. **Snapshot Testing**: Solo para componentes estables
5. **Accessibility**: Usa roles y labels ARIA

---

## 📱 Progressive Web App (PWA)

### Características PWA

- ✅ **Offline Support**: Funciona sin conexión
- ✅ **App-like Experience**: Instalable en dispositivos móviles
- ✅ **Fast Loading**: Carga instantánea con cache
- ✅ **Background Sync**: Sincronización en segundo plano
- ✅ **Push Notifications**: (Planificado)

### Service Worker

**Estrategias de Cache**:

1. **CacheFirst** (Assets estáticos):
   - JS, CSS, fonts
   - Imágenes de Cloudinary
   - Google Fonts

2. **NetworkFirst** (API calls):
   - Endpoints de diccionario
   - Búsqueda de palabras

3. **StaleWhileRevalidate** (Content updates):
   - Datos de palabras
   - Metadata

### Instalación

**Desktop**:

- Chrome: Icono de instalación en la barra de direcciones
- Edge: Menú → Apps → Instalar este sitio como app

**Mobile**:

- Android: "Agregar a pantalla de inicio"
- iOS: Safari → Compartir → "Agregar a pantalla de inicio"

### Manifest

```json path=null start=null
{
  "name": "Diccionario Misak - Model Dictionary",
  "short_name": "Misak Dictionary",
  "theme_color": "#38e07b",
  "background_color": "#122118",
  "display": "standalone",
  "start_url": "/",
  "icons": [
    { "src": "/icon-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512x512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## 🔧 Configuración

### Path Aliases

```json path=tsconfig.app.json start=24
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@pages/*": ["./src/pages/*"],
      "@hooks/*": ["./src/hooks/*"],
      "@utils/*": ["./src/utils/*"],
      "@types/*": ["./src/types/*"]
    }
  }
}
```

**Uso**:

```typescript path=null start=null
// En lugar de: import Button from '../../components/ui/Button'
import Button from '@components/ui/Button';

// En lugar de: import { cn } from '../../../utils/cn'
import { cn } from '@utils/cn';
```

### Environment Variables

**Development**:

```bash
VITE_API_URL=http://localhost:3000/api
VITE_CDN_URL=https://res.cloudinary.com/your-cloud
```

**Production**:

```bash
VITE_API_URL=https://api.diccionariomisak.com/api
VITE_CDN_URL=https://res.cloudinary.com/your-cloud
```

**Acceso en código**:

```typescript path=null start=null
const apiUrl = import.meta.env.VITE_API_URL;
const cdnUrl = import.meta.env.VITE_CDN_URL;
```

### Vite Configuration

```typescript path=vite.config.ts start=114
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
    '@components': path.resolve(__dirname, './src/components'),
    '@pages': path.resolve(__dirname, './src/pages'),
  }
},
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['react', 'react-dom', 'react-router-dom'],
        animations: ['framer-motion'],
      }
    }
  }
}
```

---

## 🚀 Deployment

### Build de Producción

```bash
# Build optimizado
pnpm build:web

# Preview del build localmente
pnpm preview:web

# Analizar tamaño del bundle
pnpm build:analyze
```

**Output**:

```
dist/
├── assets/
│   ├── index-[hash].js       # App bundle
│   ├── vendor-[hash].js      # React + dependencies
│   ├── animations-[hash].js  # Framer Motion
│   └── index-[hash].css      # Styles
├── manifest.webmanifest      # PWA manifest
├── sw.js                     # Service Worker
└── index.html                # Entry HTML
```

### Hosting Options

#### Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**vercel.json**:

```json path=null start=null
{
  "buildCommand": "pnpm build:web",
  "outputDirectory": "apps/web-client/dist",
  "framework": "vite",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

#### Netlify

```toml path=null start=null
[build]
  command = "pnpm build:web"
  publish = "apps/web-client/dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### Static Hosting (S3, Cloudflare Pages)

```bash
# Upload dist/ folder to hosting service
aws s3 sync apps/web-client/dist s3://your-bucket --delete
```

### CI/CD

**GitHub Actions** (ver `.github/workflows/deploy.yml` en raíz):

```yaml path=null start=null
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm build:web
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./apps/web-client/dist
```

---

## 🐛 Troubleshooting

### Error: "Module not found"

**Causa**: Path alias no resuelto correctamente.

**Solución**:

1. Verifica que `tsconfig.app.json` tenga los path aliases configurados
2. Reinicia el servidor de desarrollo: `Ctrl+C` → `pnpm dev:web`
3. Si persiste, elimina `node_modules` y reinstala: `pnpm install`

### Error: "Out of memory" en tests

**Causa**: Vitest consume mucha memoria con muchos tests.

**Solución**:

```bash
# Limitar workers y concurrencia
NODE_OPTIONS=--max_old_space_size=4096 pnpm test

# O editar vitest.config.ts:
{
  test: {
    maxConcurrency: 3,
    poolOptions: {
      forks: { maxForks: 2 }
    }
  }
}
```

### PWA no se actualiza

**Causa**: Service Worker cachea versión antigua.

**Solución**:

```bash
# En DevTools:
# Application → Service Workers → Unregister

# O en navegador:
# Settings → Privacy → Clear cache and site data
```

### Imágenes no cargan

**Causa**: URLs de Cloudinary incorrectas o CORS bloqueado.

**Solución**:

1. Verifica URLs en `src/constants/assets.ts`
2. Verifica configuración CORS en Cloudinary
3. Usa HTTPS en todas las URLs

---

## 📚 Recursos Adicionales

### Documentación Oficial

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vite.dev/)
- [TailwindCSS Documentation](https://tailwindcss.com/)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Vitest Documentation](https://vitest.dev/)

### Guías del Proyecto

- **[Root README](../../README.md)**: Documentación general del monorepo
- **[CHANGELOG](../../CHANGELOG.md)**: Registro completo de cambios
- **[Testing Guide](../../docs/testing/TESTING-GUIDE.md)**: Guía completa de testing
- **[Project Documentation](../../docs/project.md)**: Documentación master del proyecto

### Arquitectura del Proyecto

```
model-dictionary-v1/
├── apps/
│   ├── web-client/          👈 ESTE PROYECTO
│   └── backend-service/     # Backend API (Fastify + Prisma)
├── packages/
│   ├── shared-types/        # Types compartidos
│   └── ui-components/       # Design system (futuro)
└── docs/                    # Documentación completa
```

---

## 🤝 Contribuir

### Workflow de Desarrollo

1. **Crear rama**: `git checkout -b feature/nueva-funcionalidad`
2. **Desarrollar**: Implementar feature con tests
3. **Lint**: `pnpm lint:fix`
4. **Tests**: `pnpm test` (deben pasar todos)
5. **Commit**: `git commit -m "feat: descripción"`
6. **Push**: `git push origin feature/nueva-funcionalidad`
7. **Pull Request**: Crear PR en GitHub

### Convenciones

**Commits** (Conventional Commits):

- `feat:` - Nueva funcionalidad
- `fix:` - Bug fix
- `docs:` - Documentación
- `style:` - Formato, no cambia código
- `refactor:` - Refactorización
- `test:` - Tests
- `chore:` - Tareas de mantenimiento

**Componentes**:

- PascalCase para componentes: `Button.tsx`
- camelCase para hooks: `useLazyImage.ts`
- kebab-case para archivos de estilo: `main-layout.css`

**TypeScript**:

- Siempre tipar props de componentes
- Evitar `any`, usar `unknown` si es necesario
- Interfaces para objetos, Types para uniones/intersecciones

---

## 📊 Métricas del Proyecto

### Performance

- **Lighthouse Score**: 95+ (Performance, Accessibility, Best Practices, SEO)
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Bundle Size**: 66KB gzipped

### Testing

- **Total Tests**: 177
- **Coverage**: 98.78%
- **Test Execution Time**: ~8s (all tests)

### Code Quality

- **TypeScript Strict**: ✅ Enabled
- **ESLint Errors**: 0
- **Prettier**: ✅ Formatted
- **Dependencies**: Up-to-date

---

**Versión**: 0.1.0  
**Última Actualización**: 2025-11-30  
**Autor**: Tumi-dev  
**Repositorio**: https://github.com/Tumi-dev/misak-dictionary.git
