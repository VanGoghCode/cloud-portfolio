'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components';

/**
 * Conditionally renders the global Header on non-admin routes.
 * Avoids visual overlap and conflicting UI on admin pages.
 */
export default function ClientHeaderGate() {
  const pathname = usePathname();

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return <Header />;
}
