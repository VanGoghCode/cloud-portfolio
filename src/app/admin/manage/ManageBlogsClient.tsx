'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Button, Badge } from '@/components';
import { BlogPost, deleteBlog } from '@/lib/api';
import { FaEdit, FaTrash, FaEye, FaCalendar, FaClock, FaArrowLeft, FaPlus } from 'react-icons/fa';
import Link from 'next/link';

export default function ManageBlogsClient() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = async () => {
    try {
      setIsLoading(true);
      const apiKey = localStorage.getItem('admin_session');
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization if available to see drafts
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/blogs?limit=100`, {
        headers
      });
      
      if (!response.ok) throw new Error('Failed to load blogs');
      const data = await response.json();
      setBlogs(data.blogs || []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load blogs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const apiKey = localStorage.getItem('admin_session');
    if (!apiKey) {
      router.push('/admin');
      return;
    }

    try {
      await deleteBlog(id, apiKey);
      setBlogs(blogs.filter(b => b.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete blog');
    }
  };

  const filteredBlogs = blogs.filter(blog => {
    if (filter === 'all') return true;
    return blog.status === filter;
  });

  return (
    <div className="min-h-screen pt-20 pb-12">
      <Container className="max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/create-blog"
              className="text-foreground/70 hover:text-foreground transition-colors"
            >
              <FaArrowLeft />
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold">Manage Blogs</h1>
          </div>
          <Link href="/admin/create-blog">
            <Button className="rounded-xl gap-2">
              <FaPlus /> New Blog
            </Button>
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'text-foreground/70 hover:text-foreground'
            }`}
            style={filter === 'all' ? {} : {
              background: 'rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(10px)',
            }}
          >
            All ({blogs.length})
          </button>
          <button
            onClick={() => setFilter('published')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === 'published'
                ? 'bg-green-600 text-white'
                : 'text-foreground/70 hover:text-foreground'
            }`}
            style={filter === 'published' ? {} : {
              background: 'rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(10px)',
            }}
          >
            Published ({blogs.filter(b => b.status === 'published').length})
          </button>
          <button
            onClick={() => setFilter('draft')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === 'draft'
                ? 'bg-orange-600 text-white'
                : 'text-foreground/70 hover:text-foreground'
            }`}
            style={filter === 'draft' ? {} : {
              background: 'rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(10px)',
            }}
          >
            Drafts ({blogs.filter(b => b.status === 'draft').length})
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-foreground/70">Loading blogs...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-20">
            <p className="text-red-600">{error}</p>
            <Button onClick={loadBlogs} className="mt-4">
              Try Again
            </Button>
          </div>
        )}

        {/* Blogs List */}
        {!isLoading && !error && (
          <div className="space-y-4">
            {filteredBlogs.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-foreground/60">No blogs found</p>
              </div>
            ) : (
              filteredBlogs.map((blog) => (
                <div
                  key={blog.id}
                  className="p-6 rounded-3xl transition-all duration-300 hover:shadow-lg"
                  style={{
                    background: 'rgba(255, 255, 255, 0.4)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      {/* Status Badge */}
                      <div className="mb-2">
                        <Badge
                          variant="default"
                          className={`text-xs ${
                            blog.status === 'published'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}
                        >
                          {blog.status}
                        </Badge>
                      </div>

                      {/* Title */}
                      <h3 className="text-xl font-bold mb-2">{blog.title}</h3>

                      {/* Excerpt */}
                      <p className="text-sm text-foreground/70 mb-3 line-clamp-2">
                        {blog.excerpt}
                      </p>

                      {/* Meta */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-foreground/60">
                        <span className="flex items-center gap-1">
                          <FaCalendar className="text-blue-600" />
                          {new Date(blog.date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <FaClock className="text-purple-600" />
                          {blog.readingTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <FaEye className="text-green-600" />
                          {blog.views} views
                        </span>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {blog.tags.slice(0, 5).map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 rounded-lg bg-foreground/5 text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex md:flex-col gap-2">
                      {blog.status === 'published' && (
                        <Link href={`/blogs/${blog.id}`} target="_blank">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-xl w-full md:w-auto"
                            title="View"
                          >
                            <FaEye />
                          </Button>
                        </Link>
                      )}
                      <Link href={`/admin/edit/${blog.id}`}>
                        <Button
                          size="sm"
                          className="rounded-xl bg-blue-600 hover:bg-blue-700 w-full md:w-auto"
                          title="Edit"
                        >
                          <FaEdit />
                        </Button>
                      </Link>
                      {deleteConfirm === blog.id ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleDelete(blog.id)}
                            className="rounded-xl bg-red-600 hover:bg-red-700 w-full md:w-auto"
                          >
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteConfirm(null)}
                            className="rounded-xl w-full md:w-auto"
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => setDeleteConfirm(blog.id)}
                          className="rounded-xl bg-red-600 hover:bg-red-700 w-full md:w-auto"
                          title="Delete"
                        >
                          <FaTrash />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Container>
    </div>
  );
}
