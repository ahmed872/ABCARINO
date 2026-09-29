import { describe, expect, it } from "vitest";
import { parseInline, parseMarkdown, safeHref } from "@/lib/markdown";

describe("markdown", () => {
  it("parses headings, paragraphs and lists", () => {
    const blocks = parseMarkdown("## Title\n\nFirst line\nsame paragraph\n\n- a\n- b\n\n1. one\n2. two\n\n> quote");
    expect(blocks.map((b) => b.type)).toEqual(["h2", "p", "ul", "ol", "quote"]);
  });
  it("parses inline emphasis and links", () => {
    const nodes = parseInline("**bold** and *em* and [site](https://abcarino.com)");
    expect(nodes.map((n) => n.type)).toEqual(["strong", "text", "em", "text", "link"]);
  });
  it("drops unsafe link targets but keeps the text", () => {
    const nodes = parseInline("[click](javascript:alert(1))");
    expect(nodes).toEqual([{ type: "text", value: "click" }]);
    expect(safeHref("//evil.com")).toBeNull();
    expect(safeHref("/en/contact")).toBe("/en/contact");
  });
  it("never produces raw HTML nodes", () => {
    const blocks = parseMarkdown("<script>alert(1)</script>");
    expect(blocks).toEqual([{ type: "p", children: [{ type: "text", value: "<script>alert(1)</script>" }] }]);
  });
});
