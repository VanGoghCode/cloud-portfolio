import React from "react";

export interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

export default function Container({ 
  children, 
  className = "",
  size = "lg" 
}: ContainerProps) {
  const sizeClasses = {
    sm: "max-w-3xl",
    md: "max-w-5xl",
    lg: "max-w-7xl",
    xl: "max-w-[1400px]",
    full: "max-w-full",
  };

  return (
    <div className={`mx-auto px-4 sm:px-6 md:px-8 w-full ${sizeClasses[size]} ${className}`}>
      {children}
    </div>
  );
}
