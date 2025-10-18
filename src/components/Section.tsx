import React from "react";
import Container from "./Container";

export interface SectionProps {
  children: React.ReactNode;
  className?: string;
  containerSize?: "sm" | "md" | "lg" | "xl" | "full";
  id?: string;
  spacing?: "sm" | "md" | "lg" | "xl";
}

export default function Section({ 
  children, 
  className = "",
  containerSize = "lg",
  id,
  spacing = "lg"
}: SectionProps) {
  const spacingClasses = {
    sm: "py-8 sm:py-12",
    md: "py-12 sm:py-16 md:py-20",
    lg: "py-16 sm:py-20 md:py-24 lg:py-32",
    xl: "py-20 sm:py-28 md:py-36 lg:py-44",
  };

  return (
    <section 
      id={id}
      className={`w-full ${spacingClasses[spacing]} ${className}`}
    >
      <Container size={containerSize}>
        {children}
      </Container>
    </section>
  );
}
