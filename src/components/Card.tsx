import React from "react";
import Image from "next/image";

export interface CardProps {
  title: string;
  description: string;
  image?: string;
  tags?: string[];
  href?: string;
  className?: string;
  children?: React.ReactNode;
  variant?: "default" | "minimal";
}

export default function Card({
  title,
  description,
  image,
  tags,
  href,
  className = "",
  children,
  variant = "minimal", // Changed default to minimal
}: CardProps) {
  const cardContent = (
    <>
      {/* Image */}
      {image && (
        <div className="relative w-full aspect-video overflow-hidden rounded-t-2xl bg-foreground/5">
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      )}
      
      {/* Content */}
      <div className="p-4 sm:p-6 flex-1 flex flex-col">
        <h3 
          className="text-lg sm:text-xl font-semibold mb-2 tracking-tight"
          style={{ fontFamily: "var(--font-geist-sans)" }}
        >
          {title}
        </h3>
        
        <p 
          className="text-sm sm:text-base text-foreground/70 mb-4 flex-1"
          style={{ fontFamily: "var(--font-geist-sans)" }}
        >
          {description}
        </p>
        
        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-auto">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="px-2.5 py-1 text-xs sm:text-sm rounded-full bg-foreground/5 text-foreground/80 font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        
        {children}
      </div>
    </>
  );

  const baseClasses = variant === "minimal"
    ? `minimal-card group relative flex flex-col overflow-hidden ${className}`
    : `group relative flex flex-col overflow-hidden rounded-2xl bg-background border border-foreground/10 transition-all duration-300 hover:shadow-xl hover:border-foreground/20 hover:-translate-y-1 ${className}`;

  if (href) {
    return (
      <a 
        href={href}
        className={baseClasses}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      >
        {cardContent}
      </a>
    );
  }

  return (
    <div className={baseClasses}>
      {cardContent}
    </div>
  );
}

// Project Card variant with tech stack
export function ProjectCard({
  title,
  description,
  image,
  techStack = [],
  githubUrl,
  liveUrl,
  className = "",
}: {
  title: string;
  description: string;
  image?: string;
  techStack?: string[];
  githubUrl?: string;
  liveUrl?: string;
  className?: string;
}) {
  return (
    <Card
      title={title}
      description={description}
      image={image}
      tags={techStack}
      className={className}
    >
      {(githubUrl || liveUrl) && (
        <div className="flex gap-3 mt-4 pt-4 border-t border-foreground/10">
          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
            >
              View Code →
            </a>
          )}
          {liveUrl && (
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-foreground hover:text-foreground/70 transition-colors"
            >
              Live Demo →
            </a>
          )}
        </div>
      )}
    </Card>
  );
}
