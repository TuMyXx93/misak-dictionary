import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export type HomeSectionId = 'inicio' | 'recorrido' | 'simbolos' | 'creditos';

const HOME_SECTION_IDS: readonly HomeSectionId[] = ['inicio', 'recorrido', 'simbolos', 'creditos'];

interface UseHomeNavigationOptions {
  /** Umbral de intersección para determinar la sección activa (por defecto 0.5) */
  threshold?: number;
}

export interface UseHomeNavigationReturn {
  /** ID de la sección actualmente visible en el viewport */
  activeSection: HomeSectionId;
  /** Indica si el header debe mostrarse (oculto en el Hero/inicio, visible en las demás secciones) */
  isHeaderVisible: boolean;
  /** Función para desplazarse suavemente a una sección específica */
  scrollToSection: (sectionId: HomeSectionId) => void;
}

export function useHomeNavigation(options: UseHomeNavigationOptions = {}): UseHomeNavigationReturn {
  const { threshold = 0.5 } = options;
  const location = useLocation();

  const [activeSection, setActiveSection] = useState<HomeSectionId>(() => {
    const hash = location.hash.replace('#', '') as HomeSectionId;
    return HOME_SECTION_IDS.includes(hash) ? hash : 'inicio';
  });

  const scrollToSection = useCallback((sectionId: HomeSectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // 1. Manejo del scroll inicial o al cambiar location.hash
  useEffect(() => {
    const hash = location.hash.replace('#', '') as HomeSectionId;
    if (HOME_SECTION_IDS.includes(hash)) {
      setActiveSection(hash);
      const timer = setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
    if (!location.hash) {
      setActiveSection('inicio');
    }
  }, [location.hash]);

  // 2. IntersectionObserver para detectar la sección visible en scroll manual
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id as HomeSectionId;
            if (HOME_SECTION_IDS.includes(id)) {
              setActiveSection(id);
            }
          }
        }
      },
      {
        threshold,
        rootMargin: '-10% 0px -10% 0px',
      },
    );

    for (const id of HOME_SECTION_IDS) {
      const el = document.getElementById(id);
      if (el) {
        observer.observe(el);
      }
    }

    return () => {
      observer.disconnect();
    };
  }, [threshold]);

  // El header solo es visible cuando el usuario bajó del Hero ('inicio')
  // o si navegó explícitamente a un hash distinto de inicio
  const isHeaderVisible = activeSection !== 'inicio';

  return {
    activeSection,
    isHeaderVisible,
    scrollToSection,
  };
}
