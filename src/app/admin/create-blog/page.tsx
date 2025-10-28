import { redirect } from 'next/navigation';
import { validateAdminSession } from '@/lib/auth';
import CreateBlogPage from './ClientPage';

/**
 * Server Component wrapper for create-blog page
 * Validates session before rendering client component
 */

// Force dynamic rendering - never cache this page
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CreateBlogServerPage() {
  // Server-side session validation
  const sessionValidation = await validateAdminSession();

  if (!sessionValidation.valid) {
    // Redirect to login if no valid session
    redirect('/admin');
  }

  // Render client component only if authenticated
  return <CreateBlogPage />;
}
