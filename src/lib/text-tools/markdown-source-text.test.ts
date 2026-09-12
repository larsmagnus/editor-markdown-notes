import { describe, expect, it } from 'vitest'

import { getMarkdownSourceText } from '#src/lib/text-tools/markdown-source-text'
import { sourceOffsetAt } from '#src/lib/text-tools/source-offset'

/**
 * The mdast counterpart of `document-text.test.ts` - `prose-parity.test.ts`
 * already proves the two walks agree on the flattened text; these cover the
 * raw-source offset mapping this walk alone is responsible for.
 */
describe('getMarkdownSourceText', () => {
	it('separates blocks so retext sees distinct sentences', () => {
		expect(getMarkdownSourceText('First one.\n\nSecond one.').text).toBe(
			'First one.\n\nSecond one.'
		)
	})

	it('leaves a fenced code block out entirely', () => {
		const markdown =
			'Real prose here.\n\n```js\nconst utilize = 1\n```\n\nMore prose.'

		expect(getMarkdownSourceText(markdown).text).toBe(
			'Real prose here.\n\nMore prose.'
		)
	})

	it('maps an offset back to the raw source range it came from', () => {
		const markdown = 'The report was written.'
		const { text, slices } = getMarkdownSourceText(markdown)
		const start = text.indexOf('written')

		const from = sourceOffsetAt(slices, start)
		expect(from).not.toBeNull()
		expect(markdown.slice(from ?? 0, (from ?? 0) + 'written'.length)).toBe(
			'written'
		)
	})

	it('maps a word after a skipped code block to its real source offset', () => {
		const markdown = [
			'Intro sentence.',
			'',
			'```js',
			'const utilize = 1',
			'```',
			'',
			'The report was written.',
		].join('\n')
		const { text, slices } = getMarkdownSourceText(markdown)
		const start = text.indexOf('written')

		const from = sourceOffsetAt(slices, start)
		expect(from).not.toBeNull()
		expect(markdown.slice(from ?? 0, (from ?? 0) + 'written'.length)).toBe(
			'written'
		)
	})

	it('reads each frontmatter line as its own block, dropping the key', () => {
		const markdown =
			'---\ntitle: Roadmap\nstatus: draft\n---\n\nReal prose here.'

		expect(getMarkdownSourceText(markdown).text).toBe(
			'Roadmap\n\ndraft\n\nReal prose here.'
		)
	})

	it('maps a frontmatter value back past its key', () => {
		const markdown = '---\ntitle: The report was written\n---\n\nBody.'
		const { text, slices } = getMarkdownSourceText(markdown)
		const start = text.indexOf('written')

		const from = sourceOffsetAt(slices, start)
		expect(from).not.toBeNull()
		expect(markdown.slice(from ?? 0, (from ?? 0) + 'written'.length)).toBe(
			'written'
		)
	})
})
