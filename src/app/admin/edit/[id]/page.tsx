import { Metadata } from 'next';
import EditBlogClient from './EditBlogClient';

export const metadata: Metadata = {
  title: 'Edit Blog | Admin',
  description: 'Edit blog post',
};

export default function EditBlogPage() {
  return <EditBlogClient />;
}
