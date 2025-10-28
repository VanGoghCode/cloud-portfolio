'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Container, Button } from '@/components';
import { fetchBlogById, updateBlog } from '@/lib/api';
import { FaArrowLeft, FaSpinner } from 'react-icons/fa';
import Link from 'next/link';

export default function EditBlogClient() {
  const router = useRouter();
  const params = useParams();
  const blogId = params?.id as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [readingTime, setReadingTime] = useState('');

  useEffect(() => {
    if (blogId) {
      loadBlog();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blogId]);

  const loadBlog = async () => {
    try {
      setIsLoading(true);
      const blog = await fetchBlogById(blogId);
      setTitle(blog.title);
      setExcerpt(blog.excerpt);
      setContent(blog.content || '');
      setTags(blog.tags);
      setStatus(blog.status);
      setReadingTime(blog.readingTime);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load blog');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = async () => {
    const apiKey = localStorage.getItem('admin_session');
    if (!apiKey) {
      router.push('/admin');
      return;
    }

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setIsSaving(true);
    setError('');
    setMessage('');

    try {
      await updateBlog(blogId, {
        title: title.trim(),
        excerpt: excerpt.trim(),
        content,
        tags,
        status,
        readingTime,
      }, apiKey);

      setMessage('Blog updated successfully!');
      setTimeout(() => {
        router.push('/admin/manage');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update blog');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-foreground/70">Loading blog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <Container className="max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/admin/manage"
            className="text-foreground/70 hover:text-foreground transition-colors"
          >
            <FaArrowLeft />
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold">Edit Blog</h1>
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-6 p-4 rounded-xl bg-green-100 text-green-700">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-100 text-red-700">
            {error}
          </div>
        )}

        {/* Form */}
        <div
          className="p-8 rounded-3xl space-y-6"
          style={{
            background: 'rgba(255, 255, 255, 0.4)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          }}
        >
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              style={{
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(5px)',
              }}
              placeholder="Blog title"
            />
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Excerpt
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all min-h-[100px] resize-none"
              style={{
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(5px)',
              }}
              placeholder="Brief description"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Content *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all min-h-[400px] resize-none font-mono text-sm"
              style={{
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(5px)',
              }}
              placeholder="HTML content"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
                style={{
                  background: 'rgba(255, 255, 255, 0.7)',
                  backdropFilter: 'blur(5px)',
                }}
                placeholder="Add tag"
              />
              <Button onClick={handleAddTag} size="sm" className="rounded-xl">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-lg bg-blue-100 text-blue-700 text-sm flex items-center gap-2"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-blue-900"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
              className="px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              style={{
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(5px)',
              }}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-xl flex-1"
            >
              {isSaving ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
            <Link href="/admin/manage">
              <Button variant="ghost" className="rounded-xl">
                Cancel
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
