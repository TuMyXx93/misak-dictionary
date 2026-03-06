import { MainLayout } from '@components/layouts/MainLayout';
import { CreditsSection } from '@components/sections/CreditsSection';
import { GallerySection } from '@components/sections/GallerySection';
import { HeroSection } from '@components/sections/HeroSection';
import { InfoSection } from '@components/sections/InfoSection';
import { VideoSection } from '@components/sections/VideoSection';

/**
 * Home - Página principal del Diccionario Misak
 *
 * Orquesta todas las secciones del scrollytelling:
 * - Hero (landing con imagen)
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
