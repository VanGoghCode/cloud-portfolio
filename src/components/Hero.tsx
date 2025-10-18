import React from "react";
import Image from "next/image";

type HeroProps = {
  name?: string;
  title?: string;
};

export default function Hero({
  name = "Kirtan thummar",
  title = "Software Developer & Creative Technologist",
}: HeroProps) {
  return (
    <section
      className="relative min-h-screen w-full isolate flex items-center justify-center overflow-hidden px-4 sm:px-6 md:px-8"
    >
      {/* Floating Cloud Icon */}
      <div className="absolute right-[10%] top-1/2 -translate-y-1/2 z-20 floating-cloud">
        <div className="relative w-32 h-32 sm:w-44 sm:h-44 md:w-56 md:h-56 lg:w-64 lg:h-64">
          <Image
            src="/cloud_icon.png"
            alt="Cloud Icon"
            fill
            className="object-contain cloud-glow"
            priority
          />
        </div>
      </div>

      <div className="relative z-10">
      </div>
    </section>
  );
}