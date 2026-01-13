'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Eye, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditBlogPostPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [notFound, setNotFound] = useState(false);

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

  useEffect(() => {
    fetchPost();
  }, [params.id]);

  async function fetchPost() {
    try {
      const res = await fetch(`/api/blog/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setFormData({
          title: data.title,
          slug: data.slug,
          description: data.description || '',
          content: data.content,
          category: data.category,
          tags: data.tags.join(', '),
          coverImage: data.coverImage,
          featured: data.featured,
          published: data.published,
        });
      } else {
        setNotFound(true);
      }
    } catch (error) {
      console.error('Failed to fetch blog post:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

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

  async function handleSubmit(e: React.FormEvent, publish?: boolean) {
    e.preventDefault();
    setSaving(true);

    try {
      const tags = formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);

      const updateData: any = {
        ...formData,
        tags,
      };

      // If publish parameter is provided, update published status
      if (publish !== undefined) {
        updateData.published = publish;
        updateData.publishedAt = publish ? new Date().toISOString() : null;
      }

      const res = await fetch(`/api/blog/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (res.ok) {
        router.push('/admin/blog');
      } else {
        const error = await res.json();
        alert(error.message || 'Failed to update blog post');
      }
    } catch (error) {
      console.error('Failed to update blog post:', error);
      alert('Failed to update blog post');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading blog post...</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Blog Post Not Found
        </h1>
        <Link
          href="/admin/blog"
          className="text-blue-600 hover:text-blue-700"
        >
          Back to Blog Posts
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <Link
          href="/admin/blog"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blog Posts
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Edit Blog Post</h1>
        <p className="text-gray-600 mt-2">
          Update your blog post with MDX support
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
            Slug *
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
              placeholder="# Your Blog Post Content..."
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
          {formData.published ? (
            <>
              <button
                type="button"
                onClick={(e) => handleSubmit(e)}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Save className="h-5 w-5" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, false)}
                disabled={saving}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Unpublish
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={(e) => handleSubmit(e)}
                disabled={saving}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save as Draft'}
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Save className="h-5 w-5" />
                {saving ? 'Publishing...' : 'Publish'}
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
