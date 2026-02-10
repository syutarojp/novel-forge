import type { JSONContent } from "@tiptap/react";

export function jsonToPlainText(content: JSONContent | null): string {
  if (!content) return "";
  return extractText(content).trim();
}

function extractText(node: JSONContent): string {
  if (node.type === "text") return node.text ?? "";

  const childText = (node.content ?? []).map(extractText).join("");

  switch (node.type) {
    case "paragraph":
      return childText + "\n\n";
    case "heading":
      return childText + "\n\n";
    case "bulletList":
    case "orderedList":
      return childText + "\n";
    case "listItem":
      return "  - " + childText.trim() + "\n";
    case "blockquote":
      return childText
        .split("\n")
        .map((line) => (line ? "> " + line : ""))
        .join("\n") + "\n";
    case "horizontalRule":
      return "\n---\n\n";
    case "hardBreak":
      return "\n";
    default:
      return childText;
  }
}

export function jsonToMarkdown(content: JSONContent | null): string {
  if (!content) return "";
  return extractMarkdown(content).trim();
}

function extractMarkdown(node: JSONContent, listIndex?: number): string {
  if (node.type === "text") {
    let text = node.text ?? "";
    const marks = node.marks ?? [];
    for (const mark of marks) {
      switch (mark.type) {
        case "bold":
          text = `**${text}**`;
          break;
        case "italic":
          text = `*${text}*`;
          break;
        case "underline":
          text = `<u>${text}</u>`;
          break;
        case "strike":
          text = `~~${text}~~`;
          break;
        case "code":
          text = `\`${text}\``;
          break;
      }
    }
    return text;
  }

  const children = node.content ?? [];

  switch (node.type) {
    case "doc":
      return children.map((c) => extractMarkdown(c)).join("");
    case "paragraph":
      return children.map((c) => extractMarkdown(c)).join("") + "\n\n";
    case "heading": {
      const level = node.attrs?.level ?? 1;
      const prefix = "#".repeat(level);
      return `${prefix} ${children.map((c) => extractMarkdown(c)).join("")}\n\n`;
    }
    case "bulletList":
      return children.map((c) => extractMarkdown(c)).join("") + "\n";
    case "orderedList":
      return children.map((c, i) => extractMarkdown(c, i + 1)).join("") + "\n";
    case "listItem": {
      const prefix = listIndex !== undefined ? `${listIndex}. ` : "- ";
      const inner = children.map((c) => extractMarkdown(c)).join("").trim();
      return `${prefix}${inner}\n`;
    }
    case "blockquote": {
      const inner = children.map((c) => extractMarkdown(c)).join("");
      return inner
        .split("\n")
        .map((line) => (line.trim() ? `> ${line}` : ">"))
        .join("\n") + "\n\n";
    }
    case "horizontalRule":
      return "\n---\n\n";
    case "hardBreak":
      return "  \n";
    default:
      return children.map((c) => extractMarkdown(c)).join("");
  }
}
