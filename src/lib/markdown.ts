/**
 * Tiny, safe Markdown parser → AST. Rendering happens with React elements only
 * (never dangerouslySetInnerHTML), so admin-authored content cannot inject HTML.
 * Supports: ## / ### headings, paragraphs, - and 1. lists, > quotes,
 * **bold**, *italic*, [links](https://…).
 */
export type Inline =
  | { type: "text"; value: string }
  | { type: "strong"; children: Inline[] }
  | { type: "em"; children: Inline[] }
  | { type: "link"; href: string; children: Inline[] };

export type Block =
  | { type: "h2" | "h3"; children: Inline[] }
  | { type: "p"; children: Inline[] }
  | { type: "quote"; children: Inline[] }
  | { type: "ul" | "ol"; items: Inline[][] };

export function safeHref(href: string): string | null {
  const h = href.trim();
  if (/^https?:\/\//i.test(h) || /^mailto:/i.test(h) || /^tel:/i.test(h)) return h;
  if (h.startsWith("/") && !h.startsWith("//")) return h;
  if (h.startsWith("#")) return h;
  return null;
}

export function parseInline(src: string): Inline[] {
  const out: Inline[] = [];
  let i = 0;
  let buf = "";
  const flush = () => {
    if (buf) out.push({ type: "text", value: buf });
    buf = "";
  };
  while (i < src.length) {
    if (src.startsWith("**", i)) {
      const end = src.indexOf("**", i + 2);
      if (end > i + 2) {
        flush();
        out.push({ type: "strong", children: parseInline(src.slice(i + 2, end)) });
        i = end + 2;
        continue;
      }
    }
    if (src[i] === "*" && src[i + 1] !== "*") {
      const end = src.indexOf("*", i + 1);
      if (end > i + 1) {
        flush();
        out.push({ type: "em", children: parseInline(src.slice(i + 1, end)) });
        i = end + 1;
        continue;
      }
    }
    if (src[i] === "[") {
      const close = src.indexOf("](", i);
      const end = close > -1 ? src.indexOf(")", close + 2) : -1;
      if (close > i && end > close) {
        const href = safeHref(src.slice(close + 2, end));
        const label = src.slice(i + 1, close);
        flush();
        if (href) out.push({ type: "link", href, children: parseInline(label) });
        else out.push({ type: "text", value: label });
        i = end + 1;
        continue;
      }
    }
    buf += src[i];
    i++;
  }
  flush();
  return out;
}

export function parseMarkdown(src: string): Block[] {
  const lines = src.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: { type: "ul" | "ol"; items: Inline[][] } | null = null;

  const flushPara = () => {
    if (para.length) blocks.push({ type: "p", children: parseInline(para.join(" ")) });
    para = [];
  };
  const flushList = () => {
    if (list) blocks.push(list);
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushPara();
      flushList();
      continue;
    }
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^(#{2,3})\s+(.*)$/))) {
      flushPara();
      flushList();
      blocks.push({ type: m[1].length === 2 ? "h2" : "h3", children: parseInline(m[2]) });
    } else if ((m = line.match(/^[-*]\s+(.*)$/))) {
      flushPara();
      if (!list || list.type !== "ul") {
        flushList();
        list = { type: "ul", items: [] };
      }
      list.items.push(parseInline(m[1]));
    } else if ((m = line.match(/^\d+[.)]\s+(.*)$/))) {
      flushPara();
      if (!list || list.type !== "ol") {
        flushList();
        list = { type: "ol", items: [] };
      }
      list.items.push(parseInline(m[1]));
    } else if ((m = line.match(/^>\s?(.*)$/))) {
      flushPara();
      flushList();
      blocks.push({ type: "quote", children: parseInline(m[1]) });
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();
  return blocks;
}
