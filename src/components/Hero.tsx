'use client';

import React, { useState, useEffect } from "react";
import Image from "next/image";

type HeroProps = {
  name?: string;
  title?: string;
  description?: string;
};

export default function Hero({
  name = "Your Name",
  title = "Developer & Designer",
  description = "Passionate about creating beautiful and functional digital experiences. Specializing in cloud technologies and modern web development.",
}: HeroProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isBeyondHovered, setIsBeyondHovered] = useState(false);
  const [techIcons, setTechIcons] = useState<Array<{
    emoji: string;
    label: string;
    top?: string;
    left?: string;
    right?: string;
    delay: string;
    duration: string;
  }>>([]);

  // Complete list of tech emojis
  const allTechEmojis = [
    { emoji: '☁️', label: 'Cloud' },
    { emoji: '🌐', label: 'Internet' },
    { emoji: '📡', label: 'Satellite' },
    { emoji: '📶', label: 'Signal' },
    { emoji: '🖧', label: 'Network' },
    { emoji: '🔗', label: 'Link' },
    { emoji: '🧭', label: 'Strategy' },
    { emoji: '🧠', label: 'Intelligence' },
    { emoji: '🤖', label: 'Automation' },
    { emoji: '💾', label: 'Data Storage' },
    { emoji: '📊', label: 'Analytics' },
    { emoji: '📈', label: 'Growth' },
    { emoji: '📉', label: 'Drop' },
    { emoji: '⚙️', label: 'Engineering' },
    { emoji: '🧮', label: 'Computing' },
    { emoji: '🧰', label: 'DevOps' },
    { emoji: '🧑‍💻', label: 'Developer' },
    { emoji: '🧪', label: 'Experiment' },
    { emoji: '🔍', label: 'Query' },
    { emoji: '🧬', label: 'Machine Learning' },
    { emoji: '🔒', label: 'Locked' },
    { emoji: '🔓', label: 'Unlocked' },
    { emoji: '🛡️', label: 'Shield' },
    { emoji: '🧱', label: 'Firewall' },
    { emoji: '🚨', label: 'Alert' },
    { emoji: '🧯', label: 'Incident Response' },
    { emoji: '🕵️‍♂️', label: 'Investigation' },
    { emoji: '🔑', label: 'Key' },
    { emoji: '🧩', label: 'Integration' },
    { emoji: '🗄️', label: 'Server' },
    { emoji: '🚀', label: 'Deploy' },
    { emoji: '⚡', label: 'Performance' },
    { emoji: '🔧', label: 'Maintenance' },
    { emoji: '🪄', label: 'Automation' },
    { emoji: '📦', label: 'Container' },
  ];

  // Generate random positions for 8 emojis on client side only
  useEffect(() => {
    const getRandomPosition = () => {
      const positions = [
        { top: `${Math.random() * 15 + 10}%`, left: `${Math.random() * 10 + 2}%` },
        { top: `${Math.random() * 15 + 15}%`, right: `${Math.random() * 10 + 2}%` },
        { top: `${Math.random() * 20 + 25}%`, left: `${Math.random() * 15 + 2}%` },
        { top: `${Math.random() * 20 + 30}%`, right: `${Math.random() * 15 + 2}%` },
        { top: `${Math.random() * 20 + 45}%`, left: `${Math.random() * 12 + 2}%` },
        { top: `${Math.random() * 20 + 45}%`, right: `${Math.random() * 12 + 2}%` },
        { top: `${Math.random() * 15 + 70}%`, left: `${Math.random() * 10 + 2}%` },
        { top: `${Math.random() * 15 + 70}%`, right: `${Math.random() * 10 + 2}%` },
      ];

      return positions;
    };

    // Shuffle and pick 8 random emojis
    const shuffled = [...allTechEmojis].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 8);
    const positions = getRandomPosition();

    const icons = selected.map((icon, index) => ({
      ...icon,
      ...positions[index],
      delay: `${Math.random() * 5}s`,
      duration: `${18 + Math.random() * 5}s`,
    }));

    setTechIcons(icons);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array means this runs once on mount

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
      className="relative min-h-screen w-full isolate overflow-hidden px-4 sm:px-6 md:px-8 lg:px-12"
    >
      {/* Floating Tech Icons Background */}
      <div className="floating-tech-icons absolute inset-0 z-0">
        {techIcons.map((icon, index) => (
          <div
            key={index}
            className="tech-icon-float absolute opacity-20 pointer-events-auto"
            style={{
              top: icon.top,
              left: icon.left,
              right: icon.right,
              animationDelay: icon.delay,
              animationDuration: icon.duration,
            }}
          >
            <div className="relative group cursor-pointer">
              <span className="text-3xl sm:text-4xl md:text-5xl filter drop-shadow-lg transition-all duration-300 group-hover:scale-125 inline-block">
                {icon.emoji}
              </span>
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900/90 text-white text-xs sm:text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none z-50">
                {icon.label}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900/90"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Container - Responsive Layout */}
      <div className="hero-container h-full w-full flex flex-col items-center justify-evenly gap-12 py-20 lg:flex-row lg:gap-16 xl:gap-24 lg:py-0">
        
        {/* Left Side - Profile Section */}
        <div className="profile-section flex-shrink-0 w-full max-w-4xl">
          {/* Profile Picture and Info - Side by Side */}
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 lg:gap-10">
            {/* Profile Picture */}
            <div className="profile-image-wrapper flex-shrink-0">
              <div className="relative w-40 h-40 sm:w-44 sm:h-44 md:w-52 md:h-52 lg:w-70 lg:h-70">
                {/* Animated ring effect */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-white/5 blur-2xl"></div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500/10 to-purple-500/10 animate-pulse"></div>
                
                <Image
                  src="/profile.jpg"
                  alt={name}
                  fill
                  className="object-cover rounded-full border-4 border-white/30 shadow-2xl relative z-10"
                  priority
                />
                
                {/* Professional status indicator */}
                <div className="absolute bottom-2 right-2 z-20 flex items-center gap-1.5 bg-gradient-to-r from-green-400 to-emerald-500 px-3 py-1.5 rounded-full shadow-lg border-2 border-white/80 backdrop-blur-sm">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span className="text-xs font-semibold text-white hidden sm:inline">Available</span>
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="profile-info text-center sm:text-left flex-1 space-y-3 sm:space-y-4">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                {name}
              </h1>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-700 font-medium">
                {title}
              </p>
              <p className="text-sm sm:text-base md:text-lg text-gray-600 leading-relaxed max-w-xl">
                {description}
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Cloud Icon & Motto (Floating Together) */}
        <div className="motto-section flex-1 max-w-fit contents">
          {/* Cloud Icon and Motto Container - Floats Together */}
          <div className="relative z-20 floating-cloud-motto mx-0 w-fit">
            {/* Floating Cloud Icon */}
            <div className="relative mx-auto w-fit mb-0 sm:mb-0 lg:mb-0">
              <div className="relative w-32 h-32 sm:w-44 sm:h-44 md:w-56 md:h-56 lg:w-64 lg:h-64 xl:w-72 xl:h-72">
                <Image
                  src="/cloud-icon.png"
                  alt="Cloud Icon"
                  fill
                  className="object-contain floating-cloud cloud-glow"
                  priority
                />
              </div>
            </div>

            {/* Hero Motto - Floats with Cloud */}
            <div className="relative z-10 text-center">
              <h2 className="hero-motto">
                <span className="motto-word">{splitIntoChars('Vision', 0)}</span>
                {' '}
                <span 
                  className={`motto-word motto-beyond ${isBeyondHovered ? 'hovered' : ''}`}
                  onMouseEnter={() => setIsBeyondHovered(true)}
                  onMouseLeave={() => setIsBeyondHovered(false)}
                >
                  {splitIntoChars('Beyond', 1)}
                </span>
                {' '}
                <span className="motto-word">{splitIntoChars('Reality', 2)}</span>
              </h2>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}