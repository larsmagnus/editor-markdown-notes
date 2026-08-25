export type ImageAttrs = { src: string; alt: string; title: string | null }

/**
 * The literal `![alt](src "title")` an image's attrs read as - what
 * `image-view.tsx` reveals as real, editable text once the caret sits
 * adjacent to the image, mirroring `link-close-text.ts`'s escaping (a
 * literal paren in `src`, a literal quote in `title`).
 */
export function imageMarkdownText({ src, alt, title }: ImageAttrs): string {
	const escapedSrc = src.replace(/[()]/g, '\\$&')
	const titlePart = title ? ` "${title.replace(/"/g, '\\"')}"` : ''
	return `![${alt}](${escapedSrc}${titlePart})`
}

const IMAGE_MARKDOWN_PATTERN =
	/^!\[((?:[^\]\\]|\\.)*)\]\((\S*)(?:\s+"((?:[^"\\]|\\.)*)")?\)$/

/** Parses a value typed into the revealed markdown text back into image attrs. */
export function parseImageMarkdown(text: string): ImageAttrs | null {
	const match = IMAGE_MARKDOWN_PATTERN.exec(text.trim())
	if (!match) return null

	return {
		alt: match[1].replace(/\\([[\]])/g, '$1'),
		src: match[2].replace(/\\([()])/g, '$1'),
		title: match[3] === undefined ? null : match[3].replace(/\\"/g, '"'),
	}
}
