'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Eye } from 'lucide-react';
import Image from 'next/image';
import DOMPurify from 'isomorphic-dompurify';

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
        <p className="mt-2 text-gray-600">
          Create a new blog post with MDX support
        </p>
      </div>

      <form className="space-y-6">
        {/* Title */}
        <div>
          <label
            htmlFor="title"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Title *
          </label>
          <input
            type="text"
            id="title"
            required
            value={formData.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-ring"
            placeholder="Enter post title..."
          />
        </div>

        {/* Slug */}
        <div>
          <label
            htmlFor="slug"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Slug * <span className="text-gray-500">(auto-generated)</span>
          </label>
          <input
            type="text"
            id="slug"
            required
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 font-mono text-sm focus:border-transparent focus:ring-2 focus:ring-ring"
            placeholder="post-url-slug"
          />
          <p className="mt-1 text-sm text-gray-500">
            URL: /blogs/{formData.slug || 'post-url-slug'}
          </p>
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="mb-2 block text-sm font-medium text-gray-700"
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
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-ring"
            placeholder="Brief description for search engines..."
          />
        </div>

        {/* Category & Tags */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="category"
              className="mb-2 block text-sm font-medium text-gray-700"
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
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-ring"
              placeholder="e.g., Sustainability"
            />
          </div>
          <div>
            <label
              htmlFor="tags"
              className="mb-2 block text-sm font-medium text-gray-700"
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
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-ring"
              placeholder="eco-friendly, green-living"
            />
          </div>
        </div>

        {/* Cover Image */}
        <div>
          <label
            htmlFor="coverImage"
            className="mb-2 block text-sm font-medium text-gray-700"
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
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-ring"
            placeholder="https://images.unsplash.com/..."
          />
          {formData.coverImage && (
            <div className="relative mt-3 h-48 w-full max-w-md overflow-hidden rounded-lg">
              <Image
                src={formData.coverImage}
                alt="Cover preview"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 448px"
                unoptimized
              />
            </div>
          )}
        </div>

        {/* Content Editor */}
        <div>
          <div className="mb-2 flex items-center justify-between">
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
              <Eye className="size-4" />
              {preview ? 'Edit' : 'Preview'}
            </button>
          </div>

          {preview ? (
            <div className="prose prose-green min-h-[400px] w-full max-w-none rounded-lg border border-gray-300 bg-gray-50 px-4 py-3">
              <div
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(
                    formData.content
                      .replace(/\n/g, '<br />')
                      .replace(/#{1,6} (.+)/g, '<h3>$1</h3>')
                      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.+?)\*/g, '<em>$1</em>')
                  ),
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
              className="w-full rounded-lg border border-gray-300 px-4 py-3 font-mono text-sm focus:border-transparent focus:ring-2 focus:ring-ring"
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
          <p className="mt-2 text-sm text-gray-500">
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
              className="size-4 rounded border-gray-300 text-green-600 focus:ring-ring"
            />
            <span className="text-sm font-medium text-gray-700">
              Featured Post
            </span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 border-t pt-4">
          <button
            type="button"
            onClick={(e) => handleSubmit(e, false)}
            disabled={loading}
            className="flex-1 rounded-lg border border-gray-300 px-6 py-3 text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save as Draft'}
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-white transition-colors hover:bg-green-700 disabled:opacity-50"
          >
            <Save className="size-5" />
            {loading ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </form>
    </div>
  );
}
