import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BlogPostClient from './BlogPostClient';
import { fetchBlogById } from '@/lib/api';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  try {
    const blog = await fetchBlogById(resolvedParams.id);
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vctrx.cloud';
    const blogUrl = `${baseUrl}/blogs/${blog.id}`;
    
    return {
      title: `${blog.title} | Kirtan Thummar`,
      description: blog.excerpt,
      openGraph: {
        title: blog.title,
        description: blog.excerpt,
        type: 'article',
        url: blogUrl,
        publishedTime: blog.date,
        modifiedTime: blog.updatedAt,
        tags: blog.tags,
        siteName: 'Kirtan Thummar Portfolio',
      },
      twitter: {
        card: 'summary_large_image',
        title: blog.title,
        description: blog.excerpt,
      },
    };
  } catch {
    return {
      title: 'Blog Post Not Found',
    };
  }
}

export default async function BlogPostPage({ params }: Props) {
  const resolvedParams = await params;
  
  try {
    const blog = await fetchBlogById(resolvedParams.id);
    
    if (blog.status !== 'published') {
      notFound();
    }
    
    return <BlogPostClient blog={blog} />;
  } catch {
    notFound();
  }
}
