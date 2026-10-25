import { ScrollIndicator } from '@/components/features/scrollytelling/ScrollIndicator';
import { MainLayout } from '@/components/layouts/MainLayout';
import { PublicHeader } from '@/components/layouts/PublicHeader';
import { CreditsSection } from '@/components/sections/CreditsSection';
import { GallerySection } from '@/components/sections/GallerySection';
import { HeroSection } from '@/components/sections/HeroSection';
import { InfoSection } from '@/components/sections/InfoSection';
import { VideoSection } from '@/components/sections/VideoSection';

/**
 * Home - Página principal del Diccionario Cultural Misak
 *
 * Estructura scrollytelling mobile-first integrando orgánicamente los 4 colores
 * de la identidad Misak (#E52D6D, #0055AA, #FFFFFF, #000000):
 * 1. HeroSection - Territorio, título rotativo y campos semánticos
 * 2. VideoSection - Memoria audiovisual y recorrido del territorio
 * 3. InfoSection - El Territorio como Metáfora
 * 4. GallerySection - Símbolos oficiales (Bandera, Escudo y Equipo Lingüístico)
 * 5. CreditsSection - Autoridades del Cabildo de Guambia y contacto
 */
export const Home = () => {
  return (
    <MainLayout>
      <PublicHeader mainTargetId="home-sections" variant="overlay" />
      <ScrollIndicator />
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
