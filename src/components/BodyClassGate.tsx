'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Adds or removes a CSS class on <body> based on the current route.
 * We use this to disable global decorative overlays on admin pages.
 */
export default function BodyClassGate() {
  const pathname = usePathname();

  useEffect(() => {
    const isAdmin = pathname?.startsWith('/admin');
    const cls = 'admin-mode';

    if (isAdmin) {
      document.body.classList.add(cls);
    } else {
      document.body.classList.remove(cls);
    }

    return () => {
      // Cleanup on unmount to avoid leaking the class across navigations
      document.body.classList.remove(cls);
    };
  }, [pathname]);

  return null;
}
