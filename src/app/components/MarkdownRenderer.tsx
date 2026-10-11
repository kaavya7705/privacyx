"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const components: Components = {
  h1: ({ children }) => (
    <h1 className="text-xl font-bold text-px-text mb-3 mt-4 pb-2 border-b border-px-border/50">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-lg font-bold text-px-text mb-2 mt-3">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-semibold text-px-text mb-2 mt-2">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="text-sm text-px-text-secondary leading-relaxed mb-3 last:mb-0">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="space-y-1.5 mb-3 ml-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="space-y-1.5 mb-3 ml-1 list-decimal list-inside">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="text-sm text-px-text-secondary flex items-start gap-2">
      <span className="w-1.5 h-1.5 rounded-full bg-px-cyan/60 mt-2 flex-shrink-0" />
      <span className="flex-1">{children}</span>
    </li>
  ),
  strong: ({ children }) => (
    <strong className="font-bold text-px-text">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-px-text-secondary">{children}</em>
  ),
  code: ({ className, children }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <code className="block bg-px-bg/80 border border-px-border/50 rounded-lg p-3 text-xs font-mono text-px-cyan overflow-x-auto mb-3">
          {children}
        </code>
      );
    }
    return (
      <code className="px-1.5 py-0.5 rounded bg-px-cyan/10 text-px-cyan text-xs font-mono border border-px-cyan/20">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="mb-3 overflow-x-auto">{children}</pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-px-cyan/40 pl-4 py-1 mb-3 bg-px-cyan/5 rounded-r-lg">
      {children}
    </blockquote>
  ),
  hr: () => (
    <hr className="border-px-border/50 my-4" />
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-px-cyan hover:text-px-cyan/80 underline underline-offset-2 transition-colors"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto mb-3 rounded-lg border border-px-border/50">
      <table className="w-full text-xs">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-px-surface/60 text-px-text-secondary">{children}</thead>
  ),
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => (
    <tr className="border-b border-px-border/30 last:border-0">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="px-3 py-2 text-left font-semibold text-px-text">{children}</th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 text-px-text-secondary">{children}</td>
  ),
};

export default function MarkdownRenderer({
  content,
  className = "",
}: MarkdownRendererProps) {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
