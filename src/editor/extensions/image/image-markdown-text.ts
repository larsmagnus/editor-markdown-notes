export type ImageAttrs = { src: string; alt: string; title: string | null }

export type ImageMarkdownSource = {
	text: string
	/** Offsets of the path - `src` and an optional `title` - within `text`, excluding the parens. */
	pathFrom: number
	pathTo: number
}

/**
 * The literal `![alt](src "title")` an image's attrs read as, plus where its
 * path (`src`/`title`, the part inside the parens) falls within that text -
 * what `edit-source.ts` selects when revealing it as real, editable text.
 * Escaping mirrors `link-close-text.ts` (a literal paren in `src`, a literal
 * quote in `title`).
 */
export function imageMarkdownSource({
	src,
	alt,
	title,
}: ImageAttrs): ImageMarkdownSource {
	const escapedSrc = src.replace(/[()]/g, '\\$&')
	const titlePart = title ? ` "${title.replace(/"/g, '\\"')}"` : ''
	const prefix = `![${alt}](`
	const path = `${escapedSrc}${titlePart}`

	return {
		text: `${prefix}${path})`,
		pathFrom: prefix.length,
		pathTo: prefix.length + path.length,
	}
}

/** The literal `![alt](src "title")` an image's attrs read as. */
export function imageMarkdownText(attrs: ImageAttrs): string {
	return imageMarkdownSource(attrs).text
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
