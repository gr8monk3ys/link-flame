import fs from 'fs';
import path from 'path';
import { MDXRemote } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import { GetStaticProps, GetStaticPaths } from 'next';

// Import styles and components if needed

export default function BlogPost({ source }) {
  return (
    <div>
      {/* Render your blog post components here */}
      <MDXRemote {...source} />
    </div>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const postsDirectory = path.join(process.cwd(), 'app', 'blog');
  const filenames = fs.readdirSync(postsDirectory);

  const paths = filenames.map((filename) => {
    const slug = filename.replace(/\.mdx$/, '');
    return { params: { slug } };
  });

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const filePath = path.join(process.cwd(), 'app', 'blog', `${slug}.mdx`);
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const source = await serialize(fileContents);

  return { props: { source } };
};
