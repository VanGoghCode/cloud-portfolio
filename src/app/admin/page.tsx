import AdminLoginPage from './ClientPage';

// Force dynamic rendering - never cache admin login page
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AdminPage() {
  return <AdminLoginPage />;
}
