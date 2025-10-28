'use client';

import { BlogPost } from '@/lib/api';
import { Container, Badge } from '@/components';
import { FaCalendar, FaClock, FaEye, FaArrowLeft, FaTwitter, FaLinkedin, FaFacebook } from 'react-icons/fa';
import Link from 'next/link';
import { useEffect } from 'react';

interface BlogPostClientProps {
  blog: BlogPost;
}

export default function BlogPostClient({ blog }: BlogPostClientProps) {
  useEffect(() => {
    // Increment view count when blog is viewed
    // This could be implemented as an API call if needed
  }, [blog.id]);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = blog.title;

  const handleShare = (platform: string) => {
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    };

    window.open(urls[platform as keyof typeof urls], '_blank', 'width=600,height=400');
  };

  return (
    <main className="min-h-screen pt-20">
      {/* Back Button */}
      <Container className="mb-8">
        <Link
          href="/blogs"
          className="inline-flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground transition-colors group"
        >
          <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
          Back to all articles
        </Link>
      </Container>

      <article className="pb-20">
        <Container className="max-w-4xl">
          {/* Article Header */}
          <header className="mb-12">
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {blog.tags.map((tag, index) => (
                <Badge key={index} variant="default">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              {blog.title}
            </h1>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-foreground/60 mb-6">
              <span className="flex items-center gap-2">
                <FaCalendar className="text-blue-600" />
                {new Date(blog.date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              <span className="flex items-center gap-2">
                <FaClock className="text-purple-600" />
                {blog.readingTime}
              </span>
              <span className="flex items-center gap-2">
                <FaEye className="text-green-600" />
                {blog.views} views
              </span>
              {blog.updatedAt && blog.updatedAt !== blog.date && (
                <span className="text-xs italic">
                  Updated: {new Date(blog.updatedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              )}
            </div>

            {/* Excerpt */}
            <p className="text-xl text-foreground/80 leading-relaxed">
              {blog.excerpt}
            </p>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent mt-8"></div>
          </header>

          {/* Article Content */}
          <div 
            className="prose prose-lg dark:prose-invert max-w-none mb-12
              prose-headings:font-bold prose-headings:tracking-tight
              prose-h1:text-4xl prose-h1:mb-6 prose-h1:mt-8
              prose-h2:text-3xl prose-h2:mb-4 prose-h2:mt-8
              prose-h3:text-2xl prose-h3:mb-3 prose-h3:mt-6
              prose-h4:text-xl prose-h4:mb-2 prose-h4:mt-4
              prose-p:mb-4 prose-p:leading-relaxed
              prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
              prose-strong:font-semibold prose-strong:text-foreground
              prose-code:text-sm prose-code:bg-foreground/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
              prose-pre:bg-foreground/5 prose-pre:border prose-pre:border-foreground/10 prose-pre:rounded-xl
              prose-blockquote:border-l-4 prose-blockquote:border-blue-600 prose-blockquote:bg-blue-50/50 dark:prose-blockquote:bg-blue-900/10 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:not-italic
              prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-4
              prose-ol:list-decimal prose-ol:pl-6 prose-ol:mb-4
              prose-li:mb-2
              prose-img:rounded-xl prose-img:shadow-lg"
            dangerouslySetInnerHTML={{ __html: blog.content || '' }}
          />

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent mb-8"></div>

          {/* Share Section */}
          <div className="bg-foreground/5 rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Share this article</h3>
            <div className="flex gap-4">
              <button
                onClick={() => handleShare('twitter')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                aria-label="Share on Twitter"
              >
                <FaTwitter />
                Twitter
              </button>
              <button
                onClick={() => handleShare('linkedin')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-700 text-white hover:bg-blue-800 transition-colors"
                aria-label="Share on LinkedIn"
              >
                <FaLinkedin />
                LinkedIn
              </button>
              <button
                onClick={() => handleShare('facebook')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                aria-label="Share on Facebook"
              >
                <FaFacebook />
                Facebook
              </button>
            </div>
          </div>

          {/* Author Section (Optional - can be customized) */}
          <div className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-2xl p-8 border border-foreground/10">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                KT
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Kirtan Thummar</h3>
                <p className="text-foreground/70 mb-4">
                  Cloud-Native / DevOps Engineer with three years of experience designing secure, scalable infrastructure. 
                  Passionate about building reliable, cost-effective AWS platforms.
                </p>
                <div className="flex gap-4">
                  <Link
                    href="/"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View Profile →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </article>
    </main>
  );
}
