import { Metadata } from 'next';
import BlogsClient from './BlogsClient';

export const metadata: Metadata = {
  title: 'Blog | Kirtan Thummar',
  description: 'Articles and insights about cloud engineering, DevOps, AWS, and infrastructure automation.',
};

export default function BlogsPage() {
  return <BlogsClient />;
}
