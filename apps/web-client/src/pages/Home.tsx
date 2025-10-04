import { MainLayout } from '@components/layouts/MainLayout';
import { HeroSection } from '@components/sections/HeroSection';
import { VideoSection } from '@components/sections/VideoSection';
import { InfoSection } from '@components/sections/InfoSection';

/**
 * Home - Página principal del Diccionario Misak
 *
 * Orquesta todas las secciones del scrollytelling:
 * - Hero (landing con imagen y hotspot)
 * - Video (recorrido)
 * - Info (territorio como metáfora)
 * - Gallery (imágenes) - TODO
 * - Credits (créditos y contactos) - TODO
 */

export const Home = () => {
  return (
    <MainLayout>
      <HeroSection />
      <VideoSection />
      <InfoSection />
      {/* TODO: Agregar GallerySection y CreditsSection */}
    </MainLayout>
  );
};
