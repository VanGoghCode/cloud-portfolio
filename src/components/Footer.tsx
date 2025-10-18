import React from "react";
import Container from "./Container";

export interface FooterProps {
  name?: string;
  year?: number;
  links?: {
    label: string;
    href: string;
  }[];
  socialLinks?: {
    label: string;
    href: string;
    icon?: React.ReactNode;
  }[];
}

export default function Footer({
  name = "Kirtan thummar",
  year = new Date().getFullYear(),
  links,
  socialLinks,
}: FooterProps) {
  return (
    <footer className="w-full border-t border-foreground/10 py-8 sm:py-12 mt-auto">
      <Container>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
          {/* Copyright */}
          <div className="text-sm text-foreground/60 text-center sm:text-left">
            © {year} {name}. All rights reserved.
          </div>

          {/* Links */}
          {links && links.length > 0 && (
            <nav className="flex gap-6">
              {links.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  className="text-sm text-foreground/60 hover:text-foreground transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          )}

          {/* Social Links */}
          {socialLinks && socialLinks.length > 0 && (
            <div className="flex gap-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground/60 hover:text-foreground transition-colors"
                  aria-label={social.label}
                >
                  {social.icon || social.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </Container>
    </footer>
  );
}
