'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components';

interface NavLink {
  label: string;
  href: string;
  target?: string;
  rel?: string;
}

interface HeaderProps {
  logo?: string;
  navLinks?: NavLink[];
}

type ComputedLink = NavLink & { __sectionId?: string };

const Header: React.FC<HeaderProps> = ({
  navLinks = [
    { label: 'Home', href: '#home' },
    { label: 'About', href: '#about' },
    { label: 'Projects', href: '#projects' },
    { label: 'Blogs', href: '/blogs' },
    { label: 'Contact', href: '#contact' },
  ],
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const pathname = usePathname();

  // Compute links based on current route: section links become /#id when not on home
  const computedLinks: ComputedLink[] = useMemo(() => {
    return navLinks.map((link): ComputedLink => {
      const isSection = link.href.startsWith('#');
      if (isSection) {
        const id = link.href.slice(1);
        const href = pathname === '/' ? `#${id}` : `/#${id}`;
        return { ...link, href, __sectionId: id };
      }
      return { ...link };
    });
  }, [navLinks, pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement;
      const mobileMenu = document.querySelector('.mobile-menu');
      const mobileMenuButton = document.querySelector('.mobile-menu-button');
      const headerContainer = document.querySelector('.header-container');
      
      if (isMobileMenuOpen && 
          mobileMenu && 
          !mobileMenu.contains(target) && 
          mobileMenuButton && 
          !mobileMenuButton.contains(target) &&
          headerContainer &&
          !headerContainer.contains(target)) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside as EventListener);
      document.addEventListener('touchstart', handleClickOutside as EventListener);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside as EventListener);
      document.removeEventListener('touchstart', handleClickOutside as EventListener);
    };
  }, [isMobileMenuOpen]);

  // Active highlighting logic
  useEffect(() => {
    // On non-home pages, highlight by pathname (e.g., /blogs)
    if (pathname && pathname !== '/') {
      if (pathname.startsWith('/blogs')) {
        setActiveSection('blogs');
      } else {
        setActiveSection('');
      }
      return;
    }

    // On home page, use IntersectionObserver to track visible section
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0,
    } as IntersectionObserverInit;

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id;
          setActiveSection(sectionId);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    const sectionIds = computedLinks
      .filter((l) => l.__sectionId)
      .map((l) => l.__sectionId!);

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    if (window.scrollY < 100) setActiveSection('home');

    return () => {
      sectionIds.forEach((id) => {
        const el = document.getElementById(id);
        if (el) observer.unobserve(el);
      });
    };
  }, [pathname, computedLinks]);

  return (
    <header className="header-wrapper">
      <nav
        className={`header-container ${
          isScrolled ? 'header-scrolled' : ''
        }`}
      >
        {/* Desktop Navigation */}
        <ul className="nav-links">
          {computedLinks.map((link, index) => {
            const sectionId = link.__sectionId;
            const isRoute = !link.href.startsWith('#') && !link.href.startsWith('/#');
            const isActive = pathname === '/'
              ? sectionId ? activeSection === sectionId : false
              : isRoute ? pathname?.startsWith(link.href) : false;
            return (
              <li key={index}>
                <Link 
                  href={link.href}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                  target={link.target}
                  rel={link.rel}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          className="mobile-menu-button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <div className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </Button>
      </nav>

      {/* Mobile Menu Backdrop */}
      <div 
        className={`mobile-menu-backdrop ${isMobileMenuOpen ? 'open' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Mobile Menu */}
      <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        <ul className="mobile-nav-links">
          {computedLinks.map((link, index) => {
            const sectionId = link.__sectionId;
            const isRoute = !link.href.startsWith('#') && !link.href.startsWith('/#');
            const isActive = pathname === '/'
              ? sectionId ? activeSection === sectionId : false
              : isRoute ? pathname?.startsWith(link.href) : false;
            return (
              <li key={index}>
                <Link
                  href={link.href}
                  className={`mobile-nav-link ${isActive ? 'active' : ''}`}
                  target={link.target}
                  rel={link.rel}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </header>
  );
};

export default Header;
