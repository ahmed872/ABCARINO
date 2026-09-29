import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { parseMarkdown, type Inline } from "@/lib/markdown";
import { cn } from "@/lib/utils";

function renderInline(nodes: Inline[]): ReactNode {
  return nodes.map((n, i) => {
    switch (n.type) {
      case "text":
        return <Fragment key={i}>{n.value}</Fragment>;
      case "strong":
        return <strong key={i}>{renderInline(n.children)}</strong>;
      case "em":
        return <em key={i}>{renderInline(n.children)}</em>;
      case "link":
        return n.href.startsWith("/") ? (
          <Link key={i} href={n.href}>
            {renderInline(n.children)}
          </Link>
        ) : (
          <a key={i} href={n.href} target="_blank" rel="noopener noreferrer">
            {renderInline(n.children)}
          </a>
        );
    }
  });
}

export function Markdown({ source, className }: { source: string; className?: string }) {
  const blocks = parseMarkdown(source);
  return (
    <div className={cn("prose-abc", className)}>
      {blocks.map((b, i) => {
        switch (b.type) {
          case "h2":
            return <h2 key={i}>{renderInline(b.children)}</h2>;
          case "h3":
            return <h3 key={i}>{renderInline(b.children)}</h3>;
          case "quote":
            return <blockquote key={i}>{renderInline(b.children)}</blockquote>;
          case "ul":
            return (
              <ul key={i}>
                {b.items.map((it, j) => (
                  <li key={j}>{renderInline(it)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i}>
                {b.items.map((it, j) => (
                  <li key={j}>{renderInline(it)}</li>
                ))}
              </ol>
            );
          default:
            return <p key={i}>{renderInline(b.children)}</p>;
        }
      })}
    </div>
  );
}
