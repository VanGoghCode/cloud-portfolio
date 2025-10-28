'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Placeholder from '@tiptap/extension-placeholder';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FaBold, FaItalic, FaUnderline, FaStrikethrough, 
  FaListUl, FaListOl, FaQuoteLeft, 
  FaCode, FaImage, FaLink, FaAlignLeft, 
  FaAlignCenter, FaAlignRight, FaAlignJustify,
  FaHighlighter, FaUndo, FaRedo, FaSave, FaEye
} from 'react-icons/fa';
import { Button } from '@/components';

function CreateBlogPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [references, setReferences] = useState<string[]>(['']);
  const [featuredImage, setFeaturedImage] = useState('');
  // Status state is used for draft/published functionality
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [textColor, setTextColor] = useState('#000000');

  // Build extensions list with StarterKit explicitly disabling extensions we override
  const extensions = useMemo(() => [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3, 4],
      },
      // Disable built-in extensions that we're configuring separately to avoid duplicates
      link: false,
      // Note: StarterKit doesn't include underline by default, but being explicit
    }),
    Underline,
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    Highlight.configure({
      multicolor: true,
    }),
    Image.configure({
      inline: true,
      allowBase64: true,
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-blue-600 underline',
      },
    }),
    Color,
    TextStyle,
    Placeholder.configure({
      placeholder: 'Start writing your blog post here...',
    }),
  ], []);

  const editor = useEditor({
    // Avoid SSR hydration mismatches in Next.js by deferring initial render
    immediatelyRender: false,
    extensions,
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none min-h-[500px] max-w-none p-8',
      },
    },
  });

  // Check authentication on mount
  useEffect(() => {
    // This will be handled by middleware
  }, []);

  const setLink = useCallback(() => {
    if (!editor) return;
    
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL:', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor) return;
    
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleAddReference = () => {
    setReferences([...references, '']);
  };

  const handleRemoveReference = (index: number) => {
    setReferences(references.filter((_, i) => i !== index));
  };

  const handleReferenceChange = (index: number, value: string) => {
    const newReferences = [...references];
    newReferences[index] = value;
    setReferences(newReferences);
  };

  const calculateReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} min read`;
  };

  const handleSave = async (saveStatus: 'draft' | 'published') => {
    if (!editor) return;
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    const content = editor.getHTML();
    if (!content || content === '<p></p>') {
      setError('Content is required');
      return;
    }

    setIsSaving(true);
    setError('');
    setMessage('');

    try {
      const blogData = {
        title: title.trim(),
        excerpt: excerpt.trim() || content.substring(0, 200).replace(/<[^>]*>/g, ''),
        content,
        tags,
        references: references.filter(ref => ref.trim()),
        featuredImage: featuredImage.trim(),
        status: saveStatus,
        readingTime: calculateReadingTime(content),
        date: new Date().toISOString(),
      };

      const response = await fetch('/api/admin/create-blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(blogData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save blog post');
      }

      setMessage(`Blog post ${saveStatus === 'draft' ? 'saved as draft' : 'published'} successfully!`);
      
      // Redirect after success
      setTimeout(() => {
        router.push('/admin');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save blog post');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin');
  };

  if (!editor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-900">Loading editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Top Bar - matching header style from main site */}
      <div className="sticky top-0 z-1001 flex justify-center px-4 sm:px-6 lg:px-8 py-4">
        <div className="w-full max-w-7xl">
          <nav className="relative flex items-center justify-between px-6 py-4 rounded-2xl border border-white/30 bg-white/70 backdrop-blur-md shadow-lg transition-all duration-400">
            <h1 className="text-xl font-semibold text-gray-900">Create Blog Post</h1>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSave('draft')}
                disabled={isSaving}
                className="bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
                title="Save as Draft"
              >
                <FaSave className="mr-2" />
                Save Draft
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleSave('published')}
                disabled={isSaving}
                className="bg-white text-gray-900 hover:bg-gray-50"
                title="Publish"
              >
                <FaEye className="mr-2" />
                Publish
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="bg-white text-gray-900 hover:bg-gray-50"
                title="Logout"
              >
                Logout
              </Button>
            </div>
          </nav>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Messages */}
        {message && (
          <div className="mb-6 rounded-xl p-4 border border-emerald-400/30 bg-emerald-400/10 backdrop-blur-md">
            <p className="text-sm font-medium text-emerald-900">{message}</p>
          </div>
        )}
        {error && (
          <div className="mb-6 rounded-xl p-4 border border-red-400/30 bg-red-400/10 backdrop-blur-md">
            <p className="text-sm font-medium text-red-900">{error}</p>
          </div>
        )}

        {/* Metadata Section - glass card */}
        <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Blog Details</h2>
          
          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 text-2xl font-bold bg-transparent border-0 border-b-2 border-white/20 focus:outline-none text-gray-900 placeholder:text-gray-600"
              placeholder="Enter blog title..."
            />
          </div>

          {/* Excerpt */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Excerpt
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/20 focus:ring-2 focus:border-transparent text-gray-900 placeholder:text-gray-600"
              placeholder="Brief description of your blog post..."
            />
          </div>

          {/* Featured Image */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Featured Image URL
            </label>
            <input
              type="url"
              value={featuredImage}
              onChange={(e) => setFeaturedImage(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/20 focus:ring-2  focus:border-transparent text-gray-900 placeholder:text-gray-600"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {/* Tags */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Tags/Keywords
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-500/20 text-gray-900 border border-purple-400/30"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 text-gray-900 hover:text-gray-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/20 focus:ring-2  focus:border-transparent text-gray-900 placeholder:text-gray-600"
                placeholder="Add a tag and press Enter..."
              />
              <Button
                variant="primary"
                size="sm"
                onClick={handleAddTag}
                className="bg-white text-gray-900 hover:bg-gray-50"
              >
                Add
              </Button>
            </div>
          </div>

          {/* References */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-800 mb-2">
              References
            </label>
            {references.map((ref, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="url"
                  value={ref}
                  onChange={(e) => handleReferenceChange(index, e.target.value)}
                  className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/20 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder:text-gray-600"
                  placeholder="https://example.com/reference"
                />
                {references.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveReference(index)}
                    className="bg-white text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddReference}
              className="mt-2 bg-white text-gray-900 hover:bg-gray-50"
            >
              + Add Reference
            </Button>
          </div>
        </div>

        {/* Editor Toolbar - glass card */}
        <div className="rounded-t-2xl border border-white/20 bg-white/10 backdrop-blur-md border-b-0 p-4">
          <div className="flex flex-wrap gap-2">
            {/* Text Formatting */}
            <div className="flex gap-1 border-r border-white/20 pr-2">
              <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`p-2 rounded hover:bg-white/20 ${editor.isActive('bold') ? 'bg-purple-500/20 text-purple-900' : 'text-gray-800'}`}
                title="Bold"
              >
                <FaBold />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`p-2 rounded hover:bg-white/20 ${editor.isActive('italic') ? 'bg-purple-500/20 text-purple-900' : 'text-gray-800'}`}
                title="Italic"
              >
                <FaItalic />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={`p-2 rounded hover:bg-white/20 ${editor.isActive('underline') ? 'bg-purple-500/20 text-purple-900' : 'text-gray-800'}`}
                title="Underline"
              >
                <FaUnderline />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={`p-2 rounded hover:bg-white/20 ${editor.isActive('strike') ? 'bg-purple-500/20 text-purple-900' : 'text-gray-800'}`}
                title="Strikethrough"
              >
                <FaStrikethrough />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleHighlight().run()}
                className={`p-2 rounded hover:bg-white/20 ${editor.isActive('highlight') ? 'bg-purple-500/20 text-purple-900' : 'text-gray-800'}`}
                title="Highlight"
              >
                <FaHighlighter />
              </button>
            </div>

            {/* Headings */}
            <div className="flex gap-1 border-r border-white/20 pr-2">
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={`p-2 rounded hover:bg-white/20 ${editor.isActive('heading', { level: 1 }) ? 'bg-purple-500/20 text-purple-900' : 'text-gray-800'}`}
                title="Heading 1"
              >
                H1
              </button>
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`p-2 rounded hover:bg-white/20 ${editor.isActive('heading', { level: 2 }) ? 'bg-purple-500/20 text-purple-900' : 'text-gray-800'}`}
                title="Heading 2"
              >
                H2
              </button>
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={`p-2 rounded hover:bg-white/20 ${editor.isActive('heading', { level: 3 }) ? 'bg-purple-500/20 text-purple-900' : 'text-gray-800'}`}
                title="Heading 3"
              >
                H3
              </button>
            </div>

            {/* Lists */}
            <div className="flex gap-1 border-r border-white/20 pr-2">
              <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`p-2 rounded hover:bg-white/20 ${editor.isActive('bulletList') ? 'bg-purple-500/20 text-purple-900' : 'text-gray-800'}`}
                title="Bullet List"
              >
                <FaListUl />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`p-2 rounded hover:bg-white/20 ${editor.isActive('orderedList') ? 'bg-purple-500/20 text-purple-900' : 'text-gray-800'}`}
                title="Ordered List"
              >
                <FaListOl />
              </button>
            </div>

            {/* Alignment */}
            <div className="flex gap-1 border-r border-white/20 pr-2">
              <button
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                className={`p-2 rounded hover:bg-white/20 ${editor.isActive({ textAlign: 'left' }) ? 'bg-purple-500/20 text-purple-900' : 'text-gray-800'}`}
                title="Align Left"
              >
                <FaAlignLeft />
              </button>
              <button
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                className={`p-2 rounded hover:bg-white/20 ${editor.isActive({ textAlign: 'center' }) ? 'bg-purple-500/20 text-purple-900' : 'text-gray-800'}`}
                title="Align Center"
              >
                <FaAlignCenter />
              </button>
              <button
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                className={`p-2 rounded hover:bg-white/20 ${editor.isActive({ textAlign: 'right' }) ? 'bg-purple-500/20 text-purple-900' : 'text-gray-800'}`}
                title="Align Right"
              >
                <FaAlignRight />
              </button>
              <button
                onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                className={`p-2 rounded hover:bg-white/20 ${editor.isActive({ textAlign: 'justify' }) ? 'bg-purple-500/20 text-purple-900' : 'text-gray-800'}`}
                title="Justify"
              >
                <FaAlignJustify />
              </button>
            </div>

            {/* Insert */}
            <div className="flex gap-1 border-r border-white/20 pr-2">
              <button
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={`p-2 rounded hover:bg-white/20 ${editor.isActive('blockquote') ? 'bg-purple-500/20 text-purple-900' : 'text-gray-800'}`}
                title="Quote"
              >
                <FaQuoteLeft />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                className={`p-2 rounded hover:bg-white/20 ${editor.isActive('codeBlock') ? 'bg-purple-500/20 text-purple-900' : 'text-gray-800'}`}
                title="Code Block"
              >
                <FaCode />
              </button>
              <button
                onClick={addImage}
                className="p-2 rounded hover:bg-white/20 text-gray-800"
                title="Insert Image"
              >
                <FaImage />
              </button>
              <button
                onClick={setLink}
                className={`p-2 rounded hover:bg-white/20 ${editor.isActive('link') ? 'bg-purple-500/20 text-purple-900' : 'text-gray-800'}`}
                title="Insert Link"
              >
                <FaLink />
              </button>
            </div>

            {/* Color Picker */}
            <div className="flex gap-1 border-r border-white/20 pr-2">
              <input
                type="color"
                value={textColor}
                onChange={(e) => {
                  setTextColor(e.target.value);
                  editor.chain().focus().setColor(e.target.value).run();
                }}
                className="w-8 h-8 rounded cursor-pointer"
                title="Text Color"
              />
            </div>

            {/* Undo/Redo */}
            <div className="flex gap-1">
              <button
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                className="p-2 rounded hover:bg-white/20 text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Undo"
              >
                <FaUndo />
              </button>
              <button
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                className="p-2 rounded hover:bg-white/20 text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Redo"
              >
                <FaRedo />
              </button>
            </div>
          </div>
        </div>

        {/* Editor Content - glass card */}
        <div className="rounded-b-2xl border border-white/20 bg-white/10 backdrop-blur-md min-h-[600px] p-6">
          <EditorContent editor={editor} />
        </div>
      </div>

      <style jsx global>{`
        .ProseMirror {
          outline: none;
          color: #1f2937;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          color: #6b7280;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .ProseMirror a { color: #3b82f6; }
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1rem 0;
        }
        .ProseMirror code {
          background-color: rgba(0, 0, 0, 0.05);
          border-radius: 6px;
          padding: 3px 8px;
          font-family: 'Courier New', monospace;
          color: #1f2937;
        }
        .ProseMirror pre {
          background-color: rgba(17, 24, 39, 0.9);
          color: #e5e7eb;
          border-radius: 8px;
          padding: 1rem;
          overflow-x: auto;
        }
        .ProseMirror pre code {
          background-color: transparent;
          padding: 0;
          color: inherit;
        }
        .ProseMirror blockquote {
          border-left: 4px solid rgba(147, 51, 234, 0.6);
          padding-left: 1rem;
          margin: 1rem 0;
          color: #4b5563;
        }
        .ProseMirror mark {
          background-color: rgba(254, 243, 199, 0.8);
          padding: 2px 4px;
          border-radius: 2px;
          color: #1f2937;
        }
      `}</style>
    </div>
  );
}

export default CreateBlogPage;
