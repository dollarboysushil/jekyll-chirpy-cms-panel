import { JSONContent } from '@tiptap/react';
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link';
import TurndownService from 'turndown';

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
  emDelimiter: '_',
  strongDelimiter: '**',
  hr: '---',
});

// Don't escape special characters in markdown
turndownService.escape = (text: string) => text;

/**
 * Check if markdown contains YAML frontmatter
 */
export function hasFrontmatter(markdown: string): boolean {
  return markdown.trimStart().startsWith('---');
}

/**
 * Extract frontmatter and body from markdown
 */
export function extractFrontmatter(markdown: string): { frontmatter: string; body: string } {
  const trimmed = markdown.trimStart();
  if (!trimmed.startsWith('---')) {
    return { frontmatter: '', body: markdown };
  }

  const lines = trimmed.split('\n');
  let endIndex = -1;
  
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      endIndex = i;
      break;
    }
  }

  if (endIndex === -1) {
    return { frontmatter: '', body: markdown };
  }

  const frontmatter = lines.slice(0, endIndex + 1).join('\n');
  const body = lines.slice(endIndex + 1).join('\n');

  return { frontmatter, body };
}

/**
 * Convert Tiptap JSON to Markdown
 */
export function tiptapToMarkdown(json: JSONContent): string {
  try {
    // Generate HTML from Tiptap JSON
    const html = generateHTML(json, [
      StarterKit,
      ImageExtension,
      LinkExtension,
    ]);

    // Convert HTML to Markdown
    const markdown = turndownService.turndown(html);
    return markdown;
  } catch (error) {
    console.error('Error converting Tiptap to Markdown:', error);
    return '';
  }
}

/**
 * Convert Markdown to Tiptap JSON
 */
export function markdownToTiptap(markdown: string): JSONContent {
  try {
    // Simple markdown to Tiptap conversion
    const lines = markdown.split('\n');
    const content: any[] = [];

    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeBlockLanguage = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code block handling
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          // End code block
          content.push({
            type: 'codeBlock',
            attrs: { language: codeBlockLanguage },
            content: [{ type: 'text', text: codeBlockContent.join('\n') }],
          });
          inCodeBlock = false;
          codeBlockContent = [];
          codeBlockLanguage = '';
        } else {
          // Start code block
          inCodeBlock = true;
          codeBlockLanguage = line.substring(3).trim();
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        continue;
      }

      // Headings
      if (line.startsWith('# ')) {
        content.push({
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: line.substring(2) }],
        });
      } else if (line.startsWith('## ')) {
        content.push({
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: line.substring(3) }],
        });
      } else if (line.startsWith('### ')) {
        content.push({
          type: 'heading',
          attrs: { level: 3 },
          content: [{ type: 'text', text: line.substring(4) }],
        });
      } else if (line.startsWith('#### ')) {
        content.push({
          type: 'heading',
          attrs: { level: 4 },
          content: [{ type: 'text', text: line.substring(5) }],
        });
      } else if (line.startsWith('##### ')) {
        content.push({
          type: 'heading',
          attrs: { level: 5 },
          content: [{ type: 'text', text: line.substring(6) }],
        });
      } else if (line.startsWith('###### ')) {
        content.push({
          type: 'heading',
          attrs: { level: 6 },
          content: [{ type: 'text', text: line.substring(7) }],
        });
      }
      // Images
      else if (line.match(/^!\[([^\]]*)\]\(([^)]+)\)/)) {
        const match = line.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
        if (match) {
          content.push({
            type: 'image',
            attrs: {
              src: match[2],
              alt: match[1] || null,
            },
          });
        }
      }
      // Horizontal rule (but not YAML frontmatter delimiters)
      else if (line.match(/^---+$/) && i > 0) {
        content.push({ type: 'horizontalRule' });
      } else if (line.match(/^\*\*\*+$/)) {
        content.push({ type: 'horizontalRule' });
      }
      // Blockquote
      else if (line.startsWith('> ')) {
        const quoteContent = parseInlineMarkdown(line.substring(2));
        content.push({
          type: 'blockquote',
          content: [
            {
              type: 'paragraph',
              content: quoteContent,
            },
          ],
        });
      }
      // Unordered list
      else if (line.match(/^[\*\-\+]\s+/)) {
        const text = line.replace(/^[\*\-\+]\s+/, '');
        content.push({
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: parseInlineMarkdown(text),
                },
              ],
            },
          ],
        });
      }
      // Ordered list
      else if (line.match(/^\d+\.\s+/)) {
        const text = line.replace(/^\d+\.\s+/, '');
        content.push({
          type: 'orderedList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: parseInlineMarkdown(text),
                },
              ],
            },
          ],
        });
      }
      // Empty line
      else if (line.trim() === '') {
        // Skip or add empty paragraph
        if (content.length > 0) {
          content.push({ type: 'paragraph' });
        }
      }
      // Regular paragraph
      else {
        const paragraphContent = parseInlineMarkdown(line);
        if (paragraphContent.length > 0) {
          content.push({
            type: 'paragraph',
            content: paragraphContent,
          });
        }
      }
    }

    // If no content, add empty paragraph
    if (content.length === 0) {
      content.push({ type: 'paragraph' });
    }

    return {
      type: 'doc',
      content,
    };
  } catch (error) {
    console.error('Error converting Markdown to Tiptap:', error);
    return {
      type: 'doc',
      content: [{ type: 'paragraph' }],
    };
  }
}

/**
 * Parse inline markdown (bold, italic, code, links)
 */
function parseInlineMarkdown(text: string): any[] {
  const content: any[] = [];
  
  if (!text) return [{ type: 'text', text: '' }];

  // Simple inline parsing - you could make this more sophisticated
  let currentText = text;
  const nodes: any[] = [];

  // Handle links: [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    // Add text before link
    if (match.index > lastIndex) {
      const beforeText = text.substring(lastIndex, match.index);
      nodes.push(...parseSimpleInline(beforeText));
    }

    // Add link
    nodes.push({
      type: 'text',
      marks: [{ type: 'link', attrs: { href: match[2], target: '_blank' } }],
      text: match[1],
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    nodes.push(...parseSimpleInline(text.substring(lastIndex)));
  }

  return nodes.length > 0 ? nodes : [{ type: 'text', text }];
}

/**
 * Parse simple inline styles (bold, italic, code)
 */
function parseSimpleInline(text: string): any[] {
  if (!text) return [];

  const nodes: any[] = [];
  let current = text;

  // Very basic parsing - could be improved with proper regex
  // For now, just return as plain text
  // TODO: Add support for **bold**, *italic*, `code`, etc.
  
  return [{ type: 'text', text }];
}
