import { Metadata } from 'next';
import ManageBlogsClient from './ManageBlogsClient';

export const metadata: Metadata = {
  title: 'Manage Blogs | Admin',
  description: 'Manage blog posts, drafts, and content',
};

export default function ManageBlogsPage() {
  return <ManageBlogsClient />;
}
