import { MainLayout } from '@components/layouts/MainLayout';
import { HeroSection } from '@components/sections/HeroSection';
import { VideoSection } from '@components/sections/VideoSection';
import { InfoSection } from '@components/sections/InfoSection';
import { GallerySection } from '@components/sections/GallerySection';
import { CreditsSection } from '@components/sections/CreditsSection';

/**
 * Home - Página principal del Diccionario Misak
 *
 * Orquesta todas las secciones del scrollytelling:
 * - Hero (landing con imagen y hotspot)
 * - Video (recorrido)
 * - Info (territorio como metáfora)
 * - Gallery (imágenes)
 * - Credits (créditos y contactos)
 */

export const Home = () => {
  return (
    <MainLayout>
      <HeroSection />
      <VideoSection />
      <InfoSection />
      <GallerySection />
      <CreditsSection />
    </MainLayout>
  );
};
