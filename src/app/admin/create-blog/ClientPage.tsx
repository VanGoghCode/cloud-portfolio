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
          <p className="mt-4 text-gray-600">Loading editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold text-gray-900">Create Blog Post</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleSave('draft')}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
              >
                <FaSave className="inline mr-2" />
                Save Draft
              </button>
              <button
                onClick={() => handleSave('published')}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
              >
                <FaEye className="inline mr-2" />
                Publish
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Messages */}
        {message && (
          <div className="mb-6 rounded-lg bg-green-50 p-4 border border-green-200">
            <p className="text-sm font-medium text-green-800">{message}</p>
          </div>
        )}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 border border-red-200">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {/* Metadata Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Blog Details</h2>
          
          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 text-2xl font-bold border-0 border-b-2 border-gray-200 focus:border-purple-600 focus:outline-none"
              placeholder="Enter blog title..."
            />
          </div>

          {/* Excerpt */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Excerpt
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Brief description of your blog post..."
            />
          </div>

          {/* Featured Image */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Featured Image URL
            </label>
            <input
              type="url"
              value={featuredImage}
              onChange={(e) => setFeaturedImage(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {/* Tags */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags/Keywords
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 text-purple-600 hover:text-purple-800"
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
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Add a tag and press Enter..."
              />
              <button
                onClick={handleAddTag}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
              >
                Add
              </button>
            </div>
          </div>

          {/* References */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              References
            </label>
            {references.map((ref, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="url"
                  value={ref}
                  onChange={(e) => handleReferenceChange(index, e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="https://example.com/reference"
                />
                {references.length > 1 && (
                  <button
                    onClick={() => handleRemoveReference(index)}
                    className="px-3 py-2 text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={handleAddReference}
              className="mt-2 text-sm text-purple-600 hover:text-purple-800"
            >
              + Add Reference
            </button>
          </div>
        </div>

        {/* Editor Toolbar */}
        <div className="bg-white rounded-t-lg shadow-sm border border-gray-200 border-b-0 p-4">
          <div className="flex flex-wrap gap-2">
            {/* Text Formatting */}
            <div className="flex gap-1 border-r border-gray-200 pr-2">
              <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('bold') ? 'bg-purple-100 text-purple-600' : 'text-gray-600'}`}
                title="Bold"
              >
                <FaBold />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('italic') ? 'bg-purple-100 text-purple-600' : 'text-gray-600'}`}
                title="Italic"
              >
                <FaItalic />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('underline') ? 'bg-purple-100 text-purple-600' : 'text-gray-600'}`}
                title="Underline"
              >
                <FaUnderline />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('strike') ? 'bg-purple-100 text-purple-600' : 'text-gray-600'}`}
                title="Strikethrough"
              >
                <FaStrikethrough />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleHighlight().run()}
                className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('highlight') ? 'bg-purple-100 text-purple-600' : 'text-gray-600'}`}
                title="Highlight"
              >
                <FaHighlighter />
              </button>
            </div>

            {/* Headings */}
            <div className="flex gap-1 border-r border-gray-200 pr-2">
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('heading', { level: 1 }) ? 'bg-purple-100 text-purple-600' : 'text-gray-600'}`}
                title="Heading 1"
              >
                H1
              </button>
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('heading', { level: 2 }) ? 'bg-purple-100 text-purple-600' : 'text-gray-600'}`}
                title="Heading 2"
              >
                H2
              </button>
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('heading', { level: 3 }) ? 'bg-purple-100 text-purple-600' : 'text-gray-600'}`}
                title="Heading 3"
              >
                H3
              </button>
            </div>

            {/* Lists */}
            <div className="flex gap-1 border-r border-gray-200 pr-2">
              <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('bulletList') ? 'bg-purple-100 text-purple-600' : 'text-gray-600'}`}
                title="Bullet List"
              >
                <FaListUl />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('orderedList') ? 'bg-purple-100 text-purple-600' : 'text-gray-600'}`}
                title="Ordered List"
              >
                <FaListOl />
              </button>
            </div>

            {/* Alignment */}
            <div className="flex gap-1 border-r border-gray-200 pr-2">
              <button
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                className={`p-2 rounded hover:bg-gray-100 ${editor.isActive({ textAlign: 'left' }) ? 'bg-purple-100 text-purple-600' : 'text-gray-600'}`}
                title="Align Left"
              >
                <FaAlignLeft />
              </button>
              <button
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                className={`p-2 rounded hover:bg-gray-100 ${editor.isActive({ textAlign: 'center' }) ? 'bg-purple-100 text-purple-600' : 'text-gray-600'}`}
                title="Align Center"
              >
                <FaAlignCenter />
              </button>
              <button
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                className={`p-2 rounded hover:bg-gray-100 ${editor.isActive({ textAlign: 'right' }) ? 'bg-purple-100 text-purple-600' : 'text-gray-600'}`}
                title="Align Right"
              >
                <FaAlignRight />
              </button>
              <button
                onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                className={`p-2 rounded hover:bg-gray-100 ${editor.isActive({ textAlign: 'justify' }) ? 'bg-purple-100 text-purple-600' : 'text-gray-600'}`}
                title="Justify"
              >
                <FaAlignJustify />
              </button>
            </div>

            {/* Insert */}
            <div className="flex gap-1 border-r border-gray-200 pr-2">
              <button
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('blockquote') ? 'bg-purple-100 text-purple-600' : 'text-gray-600'}`}
                title="Quote"
              >
                <FaQuoteLeft />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('codeBlock') ? 'bg-purple-100 text-purple-600' : 'text-gray-600'}`}
                title="Code Block"
              >
                <FaCode />
              </button>
              <button
                onClick={addImage}
                className="p-2 rounded hover:bg-gray-100 text-gray-600"
                title="Insert Image"
              >
                <FaImage />
              </button>
              <button
                onClick={setLink}
                className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('link') ? 'bg-purple-100 text-purple-600' : 'text-gray-600'}`}
                title="Insert Link"
              >
                <FaLink />
              </button>
            </div>

            {/* Color Picker */}
            <div className="flex gap-1 border-r border-gray-200 pr-2">
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
                className="p-2 rounded hover:bg-gray-100 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Undo"
              >
                <FaUndo />
              </button>
              <button
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                className="p-2 rounded hover:bg-gray-100 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Redo"
              >
                <FaRedo />
              </button>
            </div>
          </div>
        </div>

        {/* Editor Content */}
        <div className="bg-white rounded-b-lg shadow-sm border border-gray-200 min-h-[600px]">
          <EditorContent editor={editor} />
        </div>
      </div>

      <style jsx global>{`
        .ProseMirror {
          outline: none;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          color: #adb5bd;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1rem 0;
        }
        .ProseMirror code {
          background-color: #f3f4f6;
          border-radius: 4px;
          padding: 2px 6px;
          font-family: 'Courier New', monospace;
        }
        .ProseMirror pre {
          background-color: #1f2937;
          color: #f3f4f6;
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
          border-left: 4px solid #9333ea;
          padding-left: 1rem;
          margin: 1rem 0;
          color: #6b7280;
        }
        .ProseMirror mark {
          background-color: #fef3c7;
          padding: 2px 4px;
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}

export default CreateBlogPage;
