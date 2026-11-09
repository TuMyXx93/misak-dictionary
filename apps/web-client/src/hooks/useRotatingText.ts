import { useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface UseRotatingTextOptions {
  texts: string[];
  intervalMs?: number;
  fadeDurationMs?: number;
}

interface UseRotatingTextReturn {
  displayText: string;
  isVisible: boolean;
}

export const useRotatingText = (options: UseRotatingTextOptions): UseRotatingTextReturn => {
  const { texts, intervalMs = 4000, fadeDurationMs = 400 } = options;
  const prefersReducedMotion = useReducedMotion() ?? false;

  const [index, setIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (prefersReducedMotion) {
      setIndex(0);
      setIsVisible(true);
      return;
    }

    const fadeInTimeout = setTimeout(() => {
      setIsVisible(true);
    }, fadeDurationMs);

    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % texts.length);
        setIsVisible(true);
      }, fadeDurationMs);
    }, intervalMs);

    return () => {
      clearInterval(interval);
      clearTimeout(fadeInTimeout);
    };
  }, [prefersReducedMotion, intervalMs, fadeDurationMs, texts.length]);

  return {
    displayText: texts[index] ?? texts[0],
    isVisible,
  };
};
