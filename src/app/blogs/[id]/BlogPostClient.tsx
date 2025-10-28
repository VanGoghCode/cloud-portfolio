'use client';

import { BlogPost, incrementBlogView, reactToBlog, addComment } from '@/lib/api';
import { Container, Badge, Button } from '@/components';
import { FaCalendar, FaClock, FaEye, FaArrowLeft, FaLinkedin, FaChevronDown, FaChevronUp, FaLink } from 'react-icons/fa';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

interface BlogPostClientProps {
  blog: BlogPost;
}

export default function BlogPostClient({ blog }: BlogPostClientProps) {
  const [views, setViews] = useState<number>(blog.views || 0);
  const [reactions, setReactions] = useState<Record<string, number>>(blog.reactions || {});
  const [comments, setComments] = useState<NonNullable<BlogPost['comments']>>(blog.comments || []);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    // Increment view count once per 24h per blog using localStorage guard
    const key = `blog_viewed_${blog.id}`;
    const last = localStorage.getItem(key);
    const now = Date.now();
    if (!last || now - parseInt(last) > 24 * 60 * 60 * 1000) {
      incrementBlogView(blog.id).then((res) => {
        if (res?.views !== undefined) setViews(res.views);
        localStorage.setItem(key, now.toString());
      }).catch(() => {});
    }

    // Hide header on mount, show on unmount
    const header = document.querySelector('.header-wrapper') as HTMLElement;
    if (header) {
      header.style.transform = 'translateY(-140%)';
      header.style.transition = 'transform 0.3s ease-in-out';
    }

    return () => {
      if (header) {
        header.style.transform = 'translateY(0)';
      }
    };
  }, [blog.id]);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const reactionEmojis = useMemo(() => ['👍', '🎉', '❤️', '🔥', '👏'], []);

  const toggleHeader = () => {
    const header = document.querySelector('.header-wrapper') as HTMLElement;
    if (header) {
      if (headerVisible) {
        header.style.transform = 'translateY(-140%)';
      } else {
        header.style.transform = 'translateY(0)';
      }
      setHeaderVisible(!headerVisible);
    }
  };

  const handleReact = async (emoji: string) => {
    const reactedKey = `blog_reacted_${blog.id}_${emoji}`;
    if (localStorage.getItem(reactedKey)) return; // prevent multiple from same client
    try {
      const res = await reactToBlog(blog.id, emoji);
      setReactions(res.reactions || {});
      localStorage.setItem(reactedKey, '1');
    } catch { /* ignore */ }
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;
    setSubmitting(true);
    try {
      const res = await addComment(blog.id, { name: name.trim(), content: content.trim(), website });
      setComments(res.comments || []);
      setName('');
      setContent('');
      setWebsite('');
    } catch {
      // optionally show toast
    } finally {
      setSubmitting(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  return (
    <main className="min-h-screen pt-20">
      {/* Floating Header Toggle Button */}
      <button
        onClick={toggleHeader}
        className="left-1/2 -translate-x-1/2 z-[1002] px-4 py-2 rounded-xl hover:scale-110 shadow-lg"
        style={{
          position: 'fixed',
          top: headerVisible ? '10vh' : '2vh',
          background: 'rgba(255, 255, 255, 0.5)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          transition: 'top 0.3s ease-in-out, transform 0.2s ease',
        }}
        aria-label="Toggle navigation"
      >
        {headerVisible ? (
          <FaChevronUp className="text-foreground/70" />
        ) : (
          <FaChevronDown className="text-foreground/70" />
        )}
      </button>

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
                {views} views
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

          {/* Interactions - Minimal Design */}
          <div className="space-y-6">
            {/* Reactions + Share Row */}
            <div 
              className="flex flex-wrap items-center justify-between gap-3 p-6 rounded-3xl transition-all duration-500"
              style={{
                background: 'rgba(255, 255, 255, 0.4)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              }}
            >
              <div className='flex items-center gap-3 group'>
              {/* Reactions */}
              {reactionEmojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReact(emoji)}
                  className="px-3 py-2 rounded-xl hover:scale-110 transition-all"
                  style={{
                    background: 'rgba(255, 255, 255, 0.6)',
                    backdropFilter: 'blur(5px)',
                  }}
                  aria-label={`React with ${emoji}`}
                  title={`React with ${emoji}`}
                >
                  <span className="text-xl">{emoji}</span>
                  <span className="text-sm text-foreground/70 font-medium">{reactions?.[emoji] || 0}</span>
                </button>
              ))}
              </div>

              {/* Divider */}
              <div className="h-6 w-px bg-foreground/10 mx-2"></div>

              {/* Share Buttons */}
              <div className="flex items-center gap-2">
                {/* LinkedIn Share */}
                <button
                  onClick={() => {
                    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
                    window.open(url, '_blank', 'width=600,height=400');
                  }}
                  className="group flex items-center gap-2 px-3 py-2 rounded-xl hover:scale-110 transition-all bg-[#0A66C2] text-white"
                  aria-label="Share on LinkedIn"
                  title="Share on LinkedIn"
                >
                  <FaLinkedin className="text-lg" />
                  <span className="text-sm font-medium">Share</span>
                </button>

                {/* Copy Link Button */}
                <button
                  onClick={copyLink}
                  className="group flex items-center gap-2 px-3 py-2 rounded-xl hover:scale-110 transition-all"
                  style={{
                    background: copySuccess ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.6)',
                    backdropFilter: 'blur(5px)',
                  }}
                  aria-label="Copy link"
                  title="Copy link"
                >
                  <FaLink className="text-lg text-foreground/70" />
                  <span className="text-sm font-medium text-foreground/70">
                    {copySuccess ? 'Copied!' : 'Copy'}
                  </span>
                </button>
              </div>
            </div>

            {/* Comments */}
            <div 
              className="p-6 rounded-3xl transition-all duration-500"
              style={{
                background: 'rgba(255, 255, 255, 0.4)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              }}
            >
              {/* Comments List */}
              {comments.length === 0 ? (
                <p className="text-foreground/50 text-sm mb-6">💬 No comments yet</p>
              ) : (
                <div className="space-y-3 mb-6">
                  {comments.map((c) => (
                    <div 
                      key={c.id} 
                      className="p-4 rounded-2xl"
                      style={{
                        background: 'rgba(255, 255, 255, 0.6)',
                        backdropFilter: 'blur(5px)',
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{c.name}</span>
                        <span className="text-xs text-foreground/50">{new Date(c.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-foreground/70 whitespace-pre-line">{c.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Comment Form */}
              <form onSubmit={submitComment} className="space-y-3">
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
                  style={{
                    background: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(5px)',
                  }}
                  required
                  maxLength={80}
                />
                {/* Honeypot */}
                <input
                  type="text"
                  placeholder="Your website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="hidden"
                  tabIndex={-1}
                  autoComplete="off"
                />
                <textarea
                  placeholder="💬 Share your thoughts..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all min-h-[100px] text-sm resize-none"
                  style={{
                    background: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(5px)',
                  }}
                  required
                  maxLength={2000}
                />
                <Button 
                  type="submit" 
                  disabled={submitting} 
                  className="rounded-xl px-6"
                  size="sm"
                >
                  {submitting ? '⏳' : '💬'} {submitting ? 'Posting...' : 'Post'}
                </Button>
              </form>
            </div>
          </div>
        </Container>
      </article>
    </main>
  );
}
