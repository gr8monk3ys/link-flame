'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Eye } from 'lucide-react';

export default function NewBlogPostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    content: '',
    category: '',
    tags: '',
    coverImage: '',
    featured: false,
    published: false,
  });

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  function handleTitleChange(title: string) {
    setFormData({
      ...formData,
      title,
      slug: generateSlug(title),
    });
  }

  async function handleSubmit(e: React.FormEvent, publish: boolean) {
    e.preventDefault();
    setLoading(true);

    try {
      const tags = formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);

      const res = await fetch('/api/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags,
          published: publish,
          publishedAt: publish ? new Date().toISOString() : null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push('/admin/blog');
      } else {
        const error = await res.json();
        alert(error.message || 'Failed to create blog post');
      }
    } catch (error) {
      console.error('Failed to create blog post:', error);
      alert('Failed to create blog post');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">New Blog Post</h1>
        <p className="text-gray-600 mt-2">
          Create a new blog post with MDX support
        </p>
      </div>

      <form className="space-y-6">
        {/* Title */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Title *
          </label>
          <input
            type="text"
            id="title"
            required
            value={formData.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Enter post title..."
          />
        </div>

        {/* Slug */}
        <div>
          <label
            htmlFor="slug"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Slug * <span className="text-gray-500">(auto-generated)</span>
          </label>
          <input
            type="text"
            id="slug"
            required
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
            placeholder="post-url-slug"
          />
          <p className="text-sm text-gray-500 mt-1">
            URL: /blogs/{formData.slug || 'post-url-slug'}
          </p>
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Description * (SEO meta description)
          </label>
          <textarea
            id="description"
            required
            rows={3}
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Brief description for search engines..."
          />
        </div>

        {/* Category & Tags */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Category *
            </label>
            <input
              type="text"
              id="category"
              required
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., Sustainability"
            />
          </div>
          <div>
            <label
              htmlFor="tags"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Tags (comma-separated)
            </label>
            <input
              type="text"
              id="tags"
              value={formData.tags}
              onChange={(e) =>
                setFormData({ ...formData, tags: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="eco-friendly, green-living"
            />
          </div>
        </div>

        {/* Cover Image */}
        <div>
          <label
            htmlFor="coverImage"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Cover Image URL *
          </label>
          <input
            type="url"
            id="coverImage"
            required
            value={formData.coverImage}
            onChange={(e) =>
              setFormData({ ...formData, coverImage: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="https://images.unsplash.com/..."
          />
          {formData.coverImage && (
            <img
              src={formData.coverImage}
              alt="Cover preview"
              className="mt-3 rounded-lg max-h-48 object-cover"
            />
          )}
        </div>

        {/* Content Editor */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label
              htmlFor="content"
              className="block text-sm font-medium text-gray-700"
            >
              Content * (MDX/Markdown supported)
            </label>
            <button
              type="button"
              onClick={() => setPreview(!preview)}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
            >
              <Eye className="h-4 w-4" />
              {preview ? 'Edit' : 'Preview'}
            </button>
          </div>

          {preview ? (
            <div className="w-full min-h-[400px] px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 prose prose-green max-w-none">
              <div
                dangerouslySetInnerHTML={{
                  __html: formData.content
                    .replace(/\n/g, '<br />')
                    .replace(/#{1,6} (.+)/g, '<h3>$1</h3>')
                    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.+?)\*/g, '<em>$1</em>'),
                }}
              />
            </div>
          ) : (
            <textarea
              id="content"
              required
              rows={20}
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
              placeholder="# Your Blog Post Content

Write your content in Markdown/MDX format...

## Subheading

Content goes here with **bold** and *italic* text.

```jsx
// Code blocks are supported
const example = 'value';
```"
            />
          )}
          <p className="text-sm text-gray-500 mt-2">
            Supports Markdown formatting: **bold**, *italic*, # headings, code blocks, etc.
          </p>
        </div>

        {/* Options */}
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.featured}
              onChange={(e) =>
                setFormData({ ...formData, featured: e.target.checked })
              }
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Featured Post
            </span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4 border-t">
          <button
            type="button"
            onClick={(e) => handleSubmit(e, false)}
            disabled={loading}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save as Draft'}
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Save className="h-5 w-5" />
            {loading ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </form>
    </div>
  );
}
