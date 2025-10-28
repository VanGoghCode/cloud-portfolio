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
    const isAdminEditor = pathname === '/admin/create-blog' || pathname?.startsWith('/admin/create-blog');
    const cls = 'admin-mode';

    // Keep neutral admin background for most admin pages, but allow full site background on the editor
    if (isAdmin && !isAdminEditor) {
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
