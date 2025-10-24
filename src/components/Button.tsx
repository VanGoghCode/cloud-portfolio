import React from "react";

/**
 * Visual variants supported by the shared Button component.
 * - primary: Solid foreground background with strong emphasis
 * - secondary: Subtle frosted/white background for less emphasis
 * - outline: Transparent with a visible outline; good for secondary actions
 * - ghost: Bare minimum styles; blends with background on hover
 * - minimal: Reserved for custom minimal styling via external CSS (unused by default)
 */
export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "minimal";
export type ButtonSize = "sm" | "md" | "lg";

/**
 * Shared Button props used across the app. Renders a <button> by default,
 * or an <a> element if `href` is provided.
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  href?: string;
  target?: string;
  rel?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    variant = "primary", 
    size = "md", 
    className = "", 
    children,
    href,
    target,
    rel,
    ...props 
  }, ref) => {
    // Base styles (minimal variant uses its own base styles)
    const baseStyles = variant === "minimal" 
      ? "minimal-btn font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:opacity-50 disabled:pointer-events-none"
      : "inline-flex items-center justify-content font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-95";
    
    // Variant styles
    const variantStyles = {
      primary: "bg-foreground text-background hover:opacity-90 focus-visible:ring-foreground shadow-lg hover:shadow-xl",
      secondary: "bg-white/70 text-black backdrop-blur shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] hover:bg-white/85 hover:shadow-[0_0_0_3px_var(--hero-glow)] focus-visible:ring-[var(--hero-glow)]",
      outline: "border-2 border-current bg-transparent hover:bg-foreground/5 focus-visible:ring-foreground",
      ghost: "bg-transparent hover:bg-foreground/5 focus-visible:ring-foreground",
      minimal: "", // Minimal styles are applied via baseStyles and CSS classes
    };
    
    // Size styles (minimal variant uses CSS classes)
    const sizeStyles = {
      sm: variant === "minimal" ? "minimal-btn-sm text-sm" : "text-sm px-4 py-2 rounded-full gap-1.5",
      md: variant === "minimal" ? "text-base" : "text-base px-6 py-2.5 sm:px-8 sm:py-3 rounded-full gap-2",
      lg: variant === "minimal" ? "minimal-btn-lg text-lg" : "text-lg px-8 py-3 sm:px-10 sm:py-4 rounded-full gap-2.5",
    };
    
    const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;
    
    // If href is provided, render as link
    if (href) {
      return (
        <a
          href={href}
          target={target}
          rel={rel}
          className={combinedClassName}
        >
          {children}
        </a>
      );
    }
    
    // Otherwise render as button
    return (
      <button
        ref={ref}
        className={combinedClassName}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
