import type { ReactNode } from 'react';

/**
 * MainLayout - Layout principal con scrollytelling
 *
 * Container principal que envuelve todas las secciones con scroll snapping
 * para crear la experiencia de scrollytelling
 */

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="h-dvh overflow-y-scroll snap-y snap-mandatory bg-black scroll-smooth [-webkit-overflow-scrolling:touch]">
      {children}
    </div>
  );
};
