import type { Token } from 'markdown-it'

const CONTENT_TYPES = new Set([
	'code_inline',
	'html_inline',
	'html_block',
	'fence',
	'code_block',
])

/**
 * What a token means, minus how it was written: `markup` (`*` or `-`, setext
 * or ATX, ``` or ~~~), source positions and list tightness are left out, so
 * two spellings of one structure compare equal. An indented code block is a
 * fence with no info string.
 */
function describeToken(token: Token): string {
	return JSON.stringify([
		token.type === 'code_block' ? 'fence' : token.type,
		token.tag,
		token.nesting,
		CONTENT_TYPES.has(token.type) ? token.content : '',
		token.info.trim(),
		token.attrs ?? [],
	])
}

/**
 * Every token in `tokens` and their inline children, text runs joined into
 * one entry each. Taken while parsing, before rendering: markdown-it's image
 * renderer rewrites the token's `alt` in place.
 */
export function describeStructure(tokens: Token[]): string[] {
	const described: string[] = []
	let text = ''
	const flushText = () => {
		if (text !== '') described.push(JSON.stringify(['text', text]))
		text = ''
	}

	for (const token of tokens.flatMap((t) =>
		t.type === 'inline' ? (t.children ?? []) : [t]
	)) {
		if (token.type === 'text') {
			text += token.content
			continue
		}
		flushText()
		described.push(describeToken(token))
	}
	flushText()

	return described
}

/** Whether two described token streams are the same document, however each was spelled. */
export function hasSameStructure(
	source: string[],
	reparsed: string[]
): boolean {
	return (
		source.length === reparsed.length &&
		source.every((entry, index) => entry === reparsed[index])
	)
}
