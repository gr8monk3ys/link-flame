import fs from 'fs';
import path from 'path';
import { MDXRemote } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';

// Function to get all blog post slugs
export async function generateStaticParams() {
  const postsDirectory = path.join(process.cwd(), 'app/blogs/[slug]');
  const filenames = fs.readdirSync(postsDirectory);

  return filenames
    .filter(filename => filename.endsWith('.mdx'))
    .map((filename) => ({
      slug: filename.replace(/\.mdx$/, ''),
    }));
}

// Function to get blog post content
async function getBlogPost(slug: string) {
  const filePath = path.join(process.cwd(), 'app/blogs/[slug]', `${slug}.mdx`);
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const source = await serialize(fileContents);
  return source;
}

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const source = await getBlogPost(params.slug);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <article className="prose lg:prose-xl">
        <MDXRemote {...source} />
      </article>
    </div>
  );
}
