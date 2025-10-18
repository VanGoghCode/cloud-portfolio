import React from "react";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "primary" | "success" | "warning" | "info";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function Badge({ 
  children, 
  variant = "default",
  size = "md",
  className = "" 
}: BadgeProps) {
  const variantClasses = {
    default: "bg-foreground/5 text-foreground/80",
    primary: "bg-foreground text-background",
    success: "bg-green-500/10 text-green-700 dark:text-green-400",
    warning: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
    info: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  };

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs sm:text-sm",
    lg: "px-3 py-1.5 text-sm sm:text-base",
  };

  return (
    <span 
      className={`inline-flex items-center rounded-full font-medium transition-colors ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </span>
  );
}

// Tech stack badge with icon support
export function TechBadge({ 
  children, 
  icon,
  className = "" 
}: { 
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <Badge variant="default" size="md" className={className}>
      {icon && <span className="mr-1.5">{icon}</span>}
      {children}
    </Badge>
  );
}
