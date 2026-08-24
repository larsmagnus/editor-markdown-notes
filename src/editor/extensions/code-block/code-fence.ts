/**
 * A fenced code block's own text, split into its fence-open line, code, and
 * fence-close line - the block's `language` attribute is gone, so this is now
 * the only source of truth for what language it is.
 */
export type ParsedFence = {
	language: string
	/** Character offset into the text where the code starts, after the opening line's `\n`. */
	codeFrom: number
	/** Character offset into the text where the code ends, before the closing fence line. */
	codeTo: number
	hasClosingFence: boolean
}

const OPEN_FENCE = /^(`{3,})([^\n]*)\n?/

/**
 * Parses a code block's literal text (fence lines included) into its
 * language and code range. Tolerant of mid-edit states: no closing fence yet,
 * an empty block, or a language tag with trailing whitespace.
 */
export function parseFence(text: string): ParsedFence {
	const open = OPEN_FENCE.exec(text)

	if (!open) {
		return {
			language: '',
			codeFrom: 0,
			codeTo: text.length,
			hasClosingFence: false,
		}
	}

	const marker = open[1]
	const language = open[2].trim()
	const codeFrom = open[0].length
	const rest = text.slice(codeFrom)

	// The closing fence, if present, is either the entire remainder (zero
	// lines of code) or a line of its own further down - both cases are one
	// match: an optional line break, then the same marker, then only
	// trailing whitespace, anchored to the very end of the block's text.
	const close = new RegExp(`(^|\\n)${marker}[ \\t]*$`).exec(rest)

	if (!close) {
		return { language, codeFrom, codeTo: text.length, hasClosingFence: false }
	}

	return {
		language,
		codeFrom,
		codeTo: codeFrom + close.index,
		hasClosingFence: true,
	}
}

/** The block's code, fence lines stripped. `''` for a block with no fence yet. */
export function fenceCode(text: string): string {
	const { codeFrom, codeTo } = parseFence(text)
	return text.slice(codeFrom, codeTo)
}

/** The block's language tag, exactly as written on its fence line. */
export function fenceLanguage(text: string): string {
	return parseFence(text).language
}

/** Builds a block's full literal text (fence lines included) from its parts. */
export function fenceText(code: string, language: string): string {
	return `\`\`\`${language}\n${code}\n\`\`\``
}

/**
 * Reinstates literal fence text into every `pre > code` markdown-it rendered,
 * from the `language-x` class it still emits - the `updateDOM` hook that
 * runs before the schema's own `parseHTML`, since markdown-it's own fence
 * rule strips the backticks out of the HTML it hands off. `languageClassPrefix`
 * matches whatever the schema's own attribute used (default `language-`).
 */
export function insertLiteralFences(
	element: Element,
	languageClassPrefix: string
): void {
	element.querySelectorAll('pre > code').forEach((code) => {
		// markdown-it always appends a trailing newline inside <code> before
		// the closing tag.
		const raw = (code.textContent ?? '').replace(/\n$/, '')
		const languageClass = Array.from(code.classList).find((name) =>
			name.startsWith(languageClassPrefix)
		)
		const language = languageClass
			? languageClass.slice(languageClassPrefix.length)
			: ''

		code.textContent = fenceText(raw, language)
	})
}
