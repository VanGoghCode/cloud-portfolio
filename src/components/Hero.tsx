'use client';

import React, { useState } from "react";
import Image from "next/image";

type HeroProps = {
  name?: string;
  title?: string;
};

export default function Hero({
}: HeroProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const splitIntoChars = (word: string, wordIndex: number) => {
    const baseIndex = wordIndex * 100; // Offset for each word
    return word.split('').map((char, index) => {
      const charIndex = baseIndex + index;
      let scale = 1;
      
      if (hoveredIndex !== null) {
        const distance = Math.abs(charIndex - hoveredIndex);
        if (distance === 0) {
          scale = 1.5; // Hovered character: 50% increase
        } else if (distance === 1) {
          scale = 1.3; // Adjacent characters: 30% increase
        } else if (distance === 2) {
          scale = 1.07; // Second-level adjacent: 7% increase
        }
      }
      
      return (
        <span
          key={index}
          className="motto-char"
          style={{ transform: `scale(${scale})` }}
          onMouseEnter={() => setHoveredIndex(charIndex)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {char}
        </span>
      );
    });
  };

  return (
    <section
      id="home"
      className="relative min-h-screen w-full isolate overflow-hidden px-4 sm:px-6 md:px-8"
    >
      {/* Container for mobile/tablet: stacked vertically, desktop: absolute positioning */}
      <div className="hero-container h-full w-full flex flex-col items-center justify-center gap-8 py-20 lg:py-0 lg:block">
        
        {/* Floating Cloud Icon */}
        <div className="relative z-20 lg:absolute lg:right-[20%] lg:top-1/2 lg:-translate-y-1/2 floating-cloud">
          <div className="relative w-32 h-32 sm:w-44 sm:h-44 md:w-56 md:h-56 lg:w-64 lg:h-64">
            <Image
              src="/cloud-icon.png"
              alt="Cloud Icon"
              fill
              className="object-contain cloud-glow"
              priority
            />
          </div>
        </div>

        {/* Hero Content with Motto */}
        <div className="relative z-10 w-full text-center lg:absolute lg:left-[20%] lg:top-1/2 lg:-translate-y-1/2 lg:max-w-[45%] lg:text-left">
          <h1 className="hero-motto">
            <span className="motto-word">{splitIntoChars('Vision', 0)}</span>
            {' '}
            <span className="motto-word">{splitIntoChars('Beyond', 1)}</span>
            {' '}
            <span className="motto-word">{splitIntoChars('Reality...', 2)}</span>
          </h1>
        </div>
      </div>
    </section>
  );
}