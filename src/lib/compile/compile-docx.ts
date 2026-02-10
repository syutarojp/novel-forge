import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  PageBreak,
} from "docx";
import { saveAs } from "file-saver";
import type { JSONContent } from "@tiptap/react";
import type { BinderItem, Project } from "@/types";
import { jsonToMarkdown } from "./json-to-text";

function jsonToDocxElements(content: JSONContent | null): Paragraph[] {
  if (!content || !content.content) return [];

  const paragraphs: Paragraph[] = [];

  for (const node of content.content) {
    switch (node.type) {
      case "heading": {
        const level = node.attrs?.level ?? 1;
        const headingLevel =
          level === 1
            ? HeadingLevel.HEADING_1
            : level === 2
            ? HeadingLevel.HEADING_2
            : HeadingLevel.HEADING_3;
        paragraphs.push(
          new Paragraph({
            heading: headingLevel,
            children: extractTextRuns(node),
            spacing: { before: 240, after: 120 },
          })
        );
        break;
      }
      case "paragraph": {
        paragraphs.push(
          new Paragraph({
            children: extractTextRuns(node),
            spacing: { after: 120 },
          })
        );
        break;
      }
      case "bulletList":
      case "orderedList": {
        const items = node.content ?? [];
        items.forEach((item, idx) => {
          const itemContent = item.content ?? [];
          for (const p of itemContent) {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text:
                      node.type === "orderedList"
                        ? `${idx + 1}. `
                        : "\u2022 ",
                  }),
                  ...extractTextRuns(p),
                ],
                indent: { left: 720 },
                spacing: { after: 60 },
              })
            );
          }
        });
        break;
      }
      case "blockquote": {
        const quoteContent = node.content ?? [];
        for (const p of quoteContent) {
          paragraphs.push(
            new Paragraph({
              children: extractTextRuns(p),
              indent: { left: 720 },
              spacing: { after: 60 },
              style: "Quote",
            })
          );
        }
        break;
      }
      case "horizontalRule": {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: "* * *" })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 240, after: 240 },
          })
        );
        break;
      }
      default:
        break;
    }
  }

  return paragraphs;
}

function extractTextRuns(node: JSONContent): TextRun[] {
  if (!node.content) return [new TextRun({ text: "" })];

  return node.content.map((child) => {
    if (child.type === "text") {
      const marks = child.marks ?? [];
      return new TextRun({
        text: child.text ?? "",
        bold: marks.some((m) => m.type === "bold"),
        italics: marks.some((m) => m.type === "italic"),
        underline: marks.some((m) => m.type === "underline")
          ? { type: "single" as const }
          : undefined,
        strike: marks.some((m) => m.type === "strike"),
      });
    }
    if (child.type === "hardBreak") {
      return new TextRun({ text: "", break: 1 });
    }
    return new TextRun({ text: "" });
  });
}

function getOrderedScenes(
  items: BinderItem[],
  parentId: string | null
): BinderItem[] {
  const children = items
    .filter((item) => item.parentId === parentId)
    .sort((a, b) => (a.sortOrder < b.sortOrder ? -1 : 1));

  const result: BinderItem[] = [];
  for (const child of children) {
    if (!child.includeInCompile) continue;

    if (child.type === "scene") {
      result.push(child);
    } else if (child.type === "folder") {
      // Add folder title as a heading scene
      result.push(child);
      result.push(...getOrderedScenes(items, child.id));
    }
  }
  return result;
}

export async function compileToDocx(
  project: Project,
  items: BinderItem[]
): Promise<void> {
  const orderedItems = getOrderedScenes(items, null);

  const sections: Paragraph[] = [];

  // Title page
  sections.push(
    new Paragraph({
      children: [
        new TextRun({ text: project.title, bold: true, size: 56 }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 3000, after: 200 },
    })
  );
  if (project.author) {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: `by ${project.author}`, size: 28 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );
  }
  sections.push(
    new Paragraph({
      children: [new PageBreak()],
    })
  );

  // Content
  for (const item of orderedItems) {
    if (item.type === "folder") {
      sections.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text: item.title })],
          spacing: { before: 480, after: 240 },
        })
      );
    } else {
      // Scene title
      sections.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text: item.title })],
          spacing: { before: 360, after: 120 },
        })
      );
      // Scene content
      sections.push(...jsonToDocxElements(item.content));
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: sections,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${project.title}.docx`);
}

export function compileToMarkdown(
  project: Project,
  items: BinderItem[]
): string {
  const orderedItems = getOrderedScenes(items, null);

  let md = `# ${project.title}\n\n`;
  if (project.author) {
    md += `*by ${project.author}*\n\n`;
  }
  md += "---\n\n";

  for (const item of orderedItems) {
    if (item.type === "folder") {
      md += `## ${item.title}\n\n`;
    } else {
      md += `### ${item.title}\n\n`;
      md += jsonToMarkdown(item.content) + "\n\n";
    }
  }

  return md;
}

export function downloadMarkdown(project: Project, items: BinderItem[]): void {
  const md = compileToMarkdown(project, items);
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  saveAs(blob, `${project.title}.md`);
}
