import { MainLayout } from '@/components/layouts/MainLayout';
import { PublicHeader } from '@/components/layouts/PublicHeader';
import { CreditsSection } from '@/components/sections/CreditsSection';
import { GallerySection } from '@/components/sections/GallerySection';
import { HeroSection } from '@/components/sections/HeroSection';
import { InfoSection } from '@/components/sections/InfoSection';
import { VideoSection } from '@/components/sections/VideoSection';
import { useHomeNavigation } from '@/hooks/useHomeNavigation';

/**
 * Home - Página principal del Diccionario Cultural Misak
 *
 * Estructura scrollytelling mobile-first integrando orgánicamente los 4 colores
 * de la identidad Misak (#E52D6D, #0055AA, #FFFFFF, #000000):
 * - Header condicional: oculto en el Hero/inicio, emerge automáticamente al hacer scroll.
 * - Navegación inteligente sincronizada con las secciones:
 * 1. HeroSection (#inicio) - Territorio, título rotativo y campos semánticos
 * 2. VideoSection (#recorrido) - Memoria audiovisual y recorrido del territorio
 * 3. InfoSection - El Territorio como Metáfora
 * 4. GallerySection (#simbolos) - Símbolos oficiales (Bandera, Escudo y Equipo Lingüístico)
 * 5. CreditsSection (#creditos) - Autoridades del Cabildo de Guambia y contacto
 */
export const Home = () => {
  const { activeSection, isHeaderVisible } = useHomeNavigation();

  return (
    <MainLayout>
      <PublicHeader
        mainTargetId="home-sections"
        variant="overlay"
        isVisible={isHeaderVisible}
        activeSection={activeSection}
      />
      <div id="home-sections">
        <HeroSection />
        <VideoSection />
        <InfoSection />
        <GallerySection />
        <CreditsSection />
      </div>
    </MainLayout>
  );
};
