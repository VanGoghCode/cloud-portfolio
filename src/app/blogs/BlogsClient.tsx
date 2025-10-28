'use client';

import { useEffect, useState, useMemo } from 'react';
import { BlogPost, fetchBlogs } from '@/lib/api';
import { Section, Container, Button, Badge } from '@/components';
import { FaSearch, FaCalendar, FaClock, FaEye } from 'react-icons/fa';
import Link from 'next/link';
import { useInView } from '@/hooks/useInView';

export default function BlogsClient() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = async () => {
    try {
      setIsLoading(true);
      const response = await fetchBlogs(50);
      setBlogs(response.blogs.filter(blog => blog.status === 'published'));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load blogs');
    } finally {
      setIsLoading(false);
    }
  };

  // Get all unique tags
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    blogs.forEach(blog => {
      blog.tags.forEach(tag => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  }, [blogs]);

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
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Blog & Insights
            </h1>
            <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
              Thoughts on cloud engineering, DevOps practices, and building scalable infrastructure
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mb-8 space-y-4">
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-foreground/10 bg-background/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Tags Filter */}
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => setSelectedTag('')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedTag === ''
                      ? 'bg-blue-600 text-white'
                      : 'bg-foreground/5 text-foreground/70 hover:bg-foreground/10'
                  }`}
                >
                  All
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedTag === tag
                        ? 'bg-blue-600 text-white'
                        : 'bg-foreground/5 text-foreground/70 hover:bg-foreground/10'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
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
              <Button onClick={loadBlogs} className="mt-4">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredBlogs.map((blog, index) => (
                <BlogCard key={blog.id} blog={blog} index={index} />
              ))}
            </div>
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
        className="group relative overflow-hidden rounded-2xl transition-all duration-500 hover:scale-[1.02] h-full"
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
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        <div className="relative z-10 p-6 h-full flex flex-col">
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
