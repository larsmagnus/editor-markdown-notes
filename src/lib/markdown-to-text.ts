import MarkdownIt from 'markdown-it'

import { splitFrontmatter } from '@/lib/frontmatter'

const md = new MarkdownIt({ html: false })

// Full blank-line separation between blocks.
const PARAGRAPH_TAGS = new Set([
	'P',
	'H1',
	'H2',
	'H3',
	'H4',
	'H5',
	'H6',
	'BLOCKQUOTE',
	'PRE',
	'TR',
])
// A single line break - tighter than a paragraph (list items).
const LINE_TAGS = new Set(['LI'])
// Cells sit side by side, not stacked.
const CELL_TAGS = new Set(['TD', 'TH'])

// markdown-it pretty-prints block tags with a bare "\n" between them (e.g.
// between </li> and <li>), which DOMParser exposes as whitespace-only text
// node siblings. Meaningful whitespace never appears this way: a soft line
// break inside a paragraph stays attached to its surrounding words in the
// same text node, and inline spacing (e.g. between `**bold**` and `*italic*`)
// is a plain space with no newline. So a text node is only ever a formatting
// artifact - safe to drop - when it is whitespace-only *and* contains a `\n`.
function isStructuralWhitespace(text: string): boolean {
	return /^\s*$/.test(text) && text.includes('\n')
}

function extractText(node: Node): string {
	let text = ''

	for (const child of Array.from(node.childNodes)) {
		if (child.nodeType === Node.TEXT_NODE) {
			const value = child.textContent ?? ''
			if (!isStructuralWhitespace(value)) text += value
			continue
		}
		if (child.nodeType !== Node.ELEMENT_NODE) continue

		const element = child as Element
		if (element.tagName === 'HR') continue

		// <img> carries its text as the `alt` attribute, not a text node child.
		text +=
			element.tagName === 'IMG'
				? (element.getAttribute('alt') ?? '')
				: extractText(element)
		if (CELL_TAGS.has(element.tagName)) text += ' '
		else if (LINE_TAGS.has(element.tagName)) text += '\n'
		else if (PARAGRAPH_TAGS.has(element.tagName)) {
			// A row's last cell already added a trailing " " separator (there's no
			// lookahead for "last cell" at that point) - strip it before the row's
			// own break so a table doesn't end every line with a stray space.
			text = text.replace(/ +$/, '') + '\n\n'
		}
	}

	return text
}

/**
 * Converts a markdown string to plain text. Syntax (headings, emphasis,
 * links, list markers, fences, table pipes, ...) is stripped, but the text
 * it carries is kept, along with any frontmatter - already plain key/value
 * text, so it needs no stripping and is kept verbatim.
 */
export function markdownToPlainText(markdown: string): string {
	const { frontmatter, body } = splitFrontmatter(markdown)
	const html = md.render(body)
	const doc = new DOMParser().parseFromString(html, 'text/html')
	const plainBody = extractText(doc.body)
		.replace(/\n{3,}/g, '\n\n')
		.trim()

	return frontmatter ? `${frontmatter.trim()}\n\n${plainBody}` : plainBody
}
