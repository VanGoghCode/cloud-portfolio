'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BlogPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/coming-soon');
  }, [router]);

  return null;
}
