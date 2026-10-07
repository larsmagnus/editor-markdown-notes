const VOID_ELEMENTS = new Set([
	'area',
	'base',
	'br',
	'col',
	'embed',
	'hr',
	'img',
	'input',
	'link',
	'meta',
	'source',
	'track',
	'wbr',
])

const TAG = /<(\/?)([a-zA-Z][\w-]*)[^>]*?(\/?)>/g
const COMMENT = /<!--[\s\S]*?-->/g

/**
 * Whether an HTML block closes every element it opens, and opens every one
 * it closes. CommonMark ends an HTML block at a blank line, so `<details>`,
 * a blank line, markdown and `</details>` arrive as two halves - each of which
 * would render as something it is not.
 */
export function isSelfContainedHtml(source: string): boolean {
	const open: string[] = []
	for (const [, closing, name, selfClosing] of source
		.replace(COMMENT, '')
		.matchAll(TAG)) {
		const tag = name.toLowerCase()
		if (VOID_ELEMENTS.has(tag) || selfClosing) continue
		if (!closing) {
			open.push(tag)
			continue
		}
		if (open.pop() !== tag) return false
	}
	return open.length === 0
}
