import type { ReactNode } from 'react';
import { DraggableSearchTrigger } from '@/components/features/semantic-fields/DraggableSearchTrigger';
import { GlobalSearchModal } from '@/components/features/semantic-fields/GlobalSearchModal';

/**
 * MainLayout - Layout principal con scrollytelling
 *
 * Container principal en ámbito público oscuro Misak (.misak-public-scope)
 * con unidades dinámicas (h-dvh) y scroll snapping suave.
 */

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div
      id="home-scroll-container"
      className="misak-public-scope h-dvh overflow-y-scroll snap-y snap-proximity md:snap-mandatory bg-black text-white scroll-smooth [-webkit-overflow-scrolling:touch]"
    >
      {children}
      <DraggableSearchTrigger />
      <GlobalSearchModal />
    </div>
  );
};
