'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { BlogPost, fetchBlogs } from '@/lib/api';
import { Section, Container, Button, Badge } from '@/components';
import { FaSearch, FaCalendar, FaClock, FaEye, FaArrowLeft, FaArrowRight, FaUserShield } from 'react-icons/fa';
import Link from 'next/link';
import { useInView } from '@/hooks/useInView';

export default function BlogsClient() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery] = useState('');
  const [selectedTag] = useState('');
  const [pageIndex, setPageIndex] = useState(1);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const cursorsRef = useRef<string[]>([""]); // cursorsRef[page-1] holds lastKey used to fetch that page
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadBlogs = useCallback(async (cursor?: string) => {
    try {
      setIsLoading(true);
      const response = await fetchBlogs(9, cursor, { q: searchQuery || undefined, tag: selectedTag || undefined });
      setBlogs(response.blogs.filter((b) => b.status === 'published'));
      setNextCursor(response.lastKey);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load blogs');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedTag]);

  // initial load
  useEffect(() => { loadBlogs(); }, [loadBlogs]);

  // react to search/tag with debounce and reset pagination
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      cursorsRef.current = [""];
      setPageIndex(1);
      loadBlogs();
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery, selectedTag, loadBlogs]);

  const goNext = async () => {
    if (!nextCursor) return;
    cursorsRef.current[pageIndex] = nextCursor; // store cursor for next page
    setPageIndex((p) => p + 1);
    await loadBlogs(nextCursor);
  };

  const goPrev = async () => {
    if (pageIndex <= 1) return;
    const prevCursor = cursorsRef.current[pageIndex - 2] || '';
    setPageIndex((p) => p - 1);
    await loadBlogs(prevCursor);
  };

  // Filter blogs based on search and tag
  const filteredBlogs = useMemo(() => {
    return blogs.filter(blog => {
      const matchesSearch = searchQuery === '' || 
        blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        blog.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTag = selectedTag === '' || blog.tags.includes(selectedTag);
      
      return matchesSearch && matchesTag;
    });
  }, [blogs, searchQuery, selectedTag]);

  return (
    <main className="min-h-screen pt-20">
      <Section>
        <Container>
          {/* Admin Access Button - Top Left Corner */}
          <Link
            href="/admin"
            className="fixed top-24 left-6 z-[999] flex items-center gap-2 px-4 py-2 rounded-xl hover:scale-110 transition-all shadow-lg"
            style={{
              background: 'rgba(59, 130, 246, 0.15)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
            title="Admin Access"
          >
            <FaUserShield className="text-blue-600" />
          </Link>

          {/* Header matching home/Projects aesthetic */}
          <div className="text-center space-y-6 mb-10">
            <div className="inline-block">
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-foreground" style={{ color: 'var(--foreground)' }}>
                Blogs
              </h1>
              <div className="h-1.5 bg-gradient-to-r from-transparent via-foreground to-transparent rounded-full mt-4"></div>
            </div>
            <p className="text-xl sm:text-2xl text-foreground/60 max-w-3xl mx-auto leading-relaxed">
              Thoughts on cloud engineering, DevOps, and scalable infrastructure
            </p>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-foreground/70">Loading articles...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <Button onClick={() => loadBlogs(cursorsRef.current[pageIndex-1] || undefined)} className="mt-4">
                Try Again
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && filteredBlogs.length === 0 && (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-foreground/5 mb-4">
                <FaSearch className="text-2xl text-foreground/40" />
              </div>
              <p className="text-foreground/70">
                {searchQuery || selectedTag
                  ? 'No articles match your search criteria'
                  : 'No articles published yet'}
              </p>
            </div>
          )}

          {/* Blog Grid */}
          {!isLoading && !error && filteredBlogs.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBlogs.map((blog, index) => (
                  <BlogCard key={blog.id} blog={blog} index={index} />
                ))}
              </div>
              {/* Pagination - minimal icons */}
              <div className="flex items-center justify-center gap-4 mt-10">
                <button
                  onClick={goPrev}
                  disabled={pageIndex <= 1}
                  className={`p-3 rounded-xl transition-all ${
                    pageIndex <= 1
                      ? 'opacity-40 cursor-not-allowed'
                      : 'hover:scale-110'
                  }`}
                  style={{
                    background: 'rgba(255, 255, 255, 0.4)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                  }}
                  aria-label="Previous page"
                >
                  <FaArrowLeft />
                </button>
                <span 
                  className="px-4 py-2 rounded-xl text-sm font-medium"
                  style={{
                    background: 'rgba(255, 255, 255, 0.4)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  {pageIndex}
                </span>
                <button
                  onClick={goNext}
                  disabled={!nextCursor}
                  className={`p-3 rounded-xl transition-all ${
                    !nextCursor
                      ? 'opacity-40 cursor-not-allowed'
                      : 'hover:scale-110 bg-blue-600 text-white'
                  }`}
                  style={!nextCursor ? {
                    background: 'rgba(255, 255, 255, 0.4)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                  } : {}}
                  aria-label="Next page"
                >
                  <FaArrowRight />
                </button>
              </div>
            </>
          )}
        </Container>
      </Section>
    </main>
  );
}

// Blog Card Component
function BlogCard({ blog, index }: { blog: BlogPost; index: number }) {
  const { ref, isInView } = useInView({ threshold: 0.1, triggerOnce: true });

  return (
    <Link href={`/blogs/${blog.id}`}>
      <div
        ref={ref}
        className="group relative overflow-hidden rounded-3xl transition-all duration-500 hover:scale-[1.03] h-full"
        style={{
          opacity: isInView ? 1 : 0,
          transform: isInView ? 'translateY(0)' : 'translateY(30px)',
          transition: `opacity 0.6s ease-out ${index * 0.1}s, transform 0.6s ease-out ${index * 0.1}s`,
          background: 'rgba(255, 255, 255, 0.4)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        }}
      >
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-5 group-hover:opacity-10 transition-opacity duration-500"></div>
        
        <div className="relative z-10 p-8 h-full flex flex-col">
          {/* Date and Reading Time */}
          <div className="flex items-center gap-4 text-xs text-foreground/60 mb-3">
            <span className="flex items-center gap-1">
              <FaCalendar className="text-blue-600" />
              {new Date(blog.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            <span className="flex items-center gap-1">
              <FaClock className="text-purple-600" />
              {blog.readingTime}
            </span>
            <span className="flex items-center gap-1">
              <FaEye className="text-green-600" />
              {blog.views}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
            {blog.title}
          </h3>

          {/* Excerpt */}
          <p className="text-sm text-foreground/70 mb-4 flex-grow line-clamp-3">
            {blog.excerpt}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-auto">
            {blog.tags.slice(0, 3).map((tag, tagIndex) => (
              <Badge
                key={tagIndex}
                variant="default"
                className="text-xs"
              >
                {tag}
              </Badge>
            ))}
            {blog.tags.length > 3 && (
              <Badge variant="default" className="text-xs">
                +{blog.tags.length - 3}
              </Badge>
            )}
          </div>

          {/* Read More Arrow */}
          <div className="mt-4 flex items-center text-sm font-medium text-blue-600 group-hover:translate-x-2 transition-transform">
            Read More
            <svg
              className="w-4 h-4 ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
