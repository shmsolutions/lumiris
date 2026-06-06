import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const BLOG_DIR = path.join(process.cwd(), 'src/content/blog');

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  /** ISO date, e.g. `2026-06-05`. */
  date: string;
  author: string;
  tags: string[];
  content: string;
};

export type BlogPostMeta = Omit<BlogPost, 'content'>;

const asString = (value: unknown) => (typeof value === 'string' ? value : '');

const parseFile = (filename: string): BlogPost => {
  const raw = fs.readFileSync(path.join(BLOG_DIR, filename), 'utf-8');
  const { data, content } = matter(raw);
  return {
    slug: filename.replace(/\.md$/u, ''),
    title: asString(data.title),
    description: asString(data.description),
    date: asString(data.date),
    author: asString(data.author),
    tags: Array.isArray(data.tags) ? data.tags.map(asString) : [],
    content,
  };
};

const readFilenames = () => fs.readdirSync(BLOG_DIR).filter((file) => file.endsWith('.md'));

/** Every post, newest first — used by the blog index and the sitemap. */
export const getAllPosts = (): BlogPost[] =>
  readFilenames()
    .map(parseFile)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

/** Slugs for `generateStaticParams`. */
export const getAllSlugs = (): string[] =>
  readFilenames().map((file) => file.replace(/\.md$/u, ''));

/** A single post by slug, or `null` when it doesn't exist. */
export const getPostBySlug = (slug: string): BlogPost | null => {
  const filename = `${slug}.md`;
  if (!fs.existsSync(path.join(BLOG_DIR, filename))) {
    return null;
  }
  return parseFile(filename);
};
