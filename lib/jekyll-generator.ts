import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TurndownService from 'turndown';
import { JSONContent } from '@tiptap/react';
import { JekyllFrontmatter } from '@/types';

/**
 * Convert Tiptap JSON content to HTML
 */
export function tiptapToHTML(content: JSONContent): string {
  try {
    const html = generateHTML(content, [
      StarterKit,
      Image,
      Link,
    ]);
    return html;
  } catch (error) {
    console.error('Error converting Tiptap to HTML:', error);
    throw new Error('Failed to convert content to HTML');
  }
}

/**
 * Convert HTML to Markdown using Turndown
 */
export function htmlToMarkdown(html: string): string {
  try {
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '-',
    });

    // Custom rule for images to preserve alt text
    turndownService.addRule('images', {
      filter: 'img',
      replacement: (content, node: any) => {
        const alt = node.getAttribute('alt') || '';
        const src = node.getAttribute('src') || '';
        return `![${alt}](${src})`;
      },
    });

    const markdown = turndownService.turndown(html);
    return markdown;
  } catch (error) {
    console.error('Error converting HTML to Markdown:', error);
    throw new Error('Failed to convert HTML to Markdown');
  }
}

/**
 * Convert Tiptap JSON content directly to Markdown
 */
export function tiptapToMarkdown(content: JSONContent): string {
  const html = tiptapToHTML(content);
  return htmlToMarkdown(html);
}

/**
 * Generate Jekyll frontmatter YAML
 */
export function generateFrontmatter(data: JekyllFrontmatter): string {
  const lines = ['---'];
  
  lines.push(`title: "${data.title.replace(/"/g, '\\"')}"`);
  lines.push(`date: ${data.date}`);
  
  if (data.categories && data.categories.length > 0) {
    lines.push(`categories: [${data.categories.join(', ')}]`);
  }
  
  if (data.tags && data.tags.length > 0) {
    lines.push(`tags: [${data.tags.join(', ')}]`);
  }
  
  if (data.image) {
    lines.push('image:');
    lines.push(`  path: ${data.image.path}`);
    lines.push(`  alt: "${data.image.alt.replace(/"/g, '\\"')}"`);
  }
  
  lines.push('---');
  lines.push('');
  
  return lines.join('\n');
}

/**
 * Generate complete Jekyll post content
 */
export function generateJekyllPost(
  frontmatter: JekyllFrontmatter,
  content: JSONContent
): string {
  const frontmatterYAML = generateFrontmatter(frontmatter);
  const markdown = tiptapToMarkdown(content);
  
  return frontmatterYAML + markdown;
}

/**
 * Generate slug from title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate Jekyll post filename
 */
export function generatePostFilename(date: Date, slug: string): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}-${slug}.md`;
}

/**
 * Format date for Jekyll frontmatter
 */
export function formatJekyllDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} +0545`;
}

/**
 * Replace blob URLs with GitHub URLs in markdown
 */
export function replaceImageUrls(
  markdown: string,
  urlMap: Map<string, string>
): string {
  let result = markdown;
  
  urlMap.forEach((githubUrl, blobUrl) => {
    result = result.replace(new RegExp(escapeRegExp(blobUrl), 'g'), githubUrl);
  });
  
  return result;
}

/**
 * Escape special characters for regex
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
