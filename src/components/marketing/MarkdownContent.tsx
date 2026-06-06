import type { Components } from 'react-markdown';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Map Markdown elements onto the editorial design system (font-display
// headings, ink/brand palette) instead of pulling in a generic prose plugin.
const components: Components = {
  h1: (props) => (
    <h2 className="font-display mt-12 text-2xl text-ink-900 sm:text-3xl">{props.children}</h2>
  ),
  h2: (props) => (
    <h2 className="font-display mt-12 text-2xl text-ink-900 sm:text-3xl">{props.children}</h2>
  ),
  h3: (props) => <h3 className="mt-8 text-lg font-semibold text-ink-900">{props.children}</h3>,
  p: (props) => <p className="mt-5 text-base leading-relaxed text-ink-700">{props.children}</p>,
  ul: (props) => (
    <ul className="mt-5 list-disc space-y-2 pl-5 text-base text-ink-700">{props.children}</ul>
  ),
  ol: (props) => (
    <ol className="mt-5 list-decimal space-y-2 pl-5 text-base text-ink-700">{props.children}</ol>
  ),
  li: (props) => <li className="leading-relaxed">{props.children}</li>,
  a: (props) => (
    <a
      href={props.href}
      className="font-medium text-brand-700 underline underline-offset-4 hover:text-brand-800"
    >
      {props.children}
    </a>
  ),
  strong: (props) => <strong className="font-semibold text-ink-900">{props.children}</strong>,
  blockquote: (props) => (
    <blockquote className="mt-6 border-l-2 border-brand-400 pl-4 text-ink-600 italic">
      {props.children}
    </blockquote>
  ),
  code: (props) => (
    <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-sm text-ink-800">
      {props.children}
    </code>
  ),
  hr: () => <hr className="my-10 border-ink-200" />,
};

/** Renders a trusted Markdown string as styled editorial content. */
export const MarkdownContent = (props: { children: string }) => (
  <Markdown components={components} remarkPlugins={[remarkGfm]}>
    {props.children}
  </Markdown>
);
