'use client';

/**
 * Hero Showcase Context
 *
 * Provides shared state between HeroSection and HeroShowcaseSlider
 * to synchronize feature text with active slide animations.
 */

import { createContext, useContext, useState, ReactNode } from 'react';

interface HeroShowcaseContextType {
  activeSlideIndex: number;
  setActiveSlideIndex: (index: number) => void;
}

const HeroShowcaseContext = createContext<HeroShowcaseContextType | undefined>(undefined);

export function HeroShowcaseProvider({ children }: { children: ReactNode }) {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  return (
    <HeroShowcaseContext.Provider value={{ activeSlideIndex, setActiveSlideIndex }}>
      {children}
    </HeroShowcaseContext.Provider>
  );
}

export function useHeroShowcase() {
  const context = useContext(HeroShowcaseContext);
  if (!context) {
    throw new Error('useHeroShowcase must be used within HeroShowcaseProvider');
  }
  return context;
}
