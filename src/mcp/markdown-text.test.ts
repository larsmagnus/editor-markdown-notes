import { describe, expect, it } from 'vitest'

import { markdownProse } from '@/mcp/markdown-text'

/**
 * Positions are the part an agent acts on, and the part that fails silently:
 * handed the wrong line it edits confidently in the wrong place. Each case
 * below locates a word in the extracted prose and asserts where the mapping
 * puts it back in the file, so a drift in the offset arithmetic shows up as a
 * wrong line rather than as a plausible one.
 */
function positionOf(markdown: string, word: string) {
	const prose = markdownProse(markdown)

	return prose.positionAt(prose.text.indexOf(word))
}

describe('markdownProse positions', () => {
	it('points at the line the prose actually sits on', () => {
		const note = '# Release notes\n\nThe report was written by the committee.\n'

		expect(positionOf(note, 'written')).toEqual({ line: 3, column: 16 })
	})

	it('counts the lines a skipped code block occupies', () => {
		const note = [
			'Intro sentence.',
			'',
			'```js',
			'const utilize = 1',
			'```',
			'',
			'The report was written by the committee.',
		].join('\n')

		expect(positionOf(note, 'written')).toEqual({ line: 7, column: 16 })
	})

	it('counts the lines frontmatter occupies', () => {
		const note = '---\ntitle: A note\nslug: a-note\n---\n\nUtilise this form.\n'

		expect(positionOf(note, 'Utilise')).toEqual({ line: 6, column: 1 })
	})

	it('locates prose inside a frontmatter value, past its key', () => {
		const note = '---\ntitle: The report was written\n---\n\nBody.\n'

		expect(positionOf(note, 'written')).toEqual({ line: 2, column: 23 })
	})

	it('keeps positions true across an inline code substitution', () => {
		const note = 'Run `pnpm build` before you commence the release.\n'

		expect(positionOf(note, 'commence')).toEqual({ line: 1, column: 29 })
	})

	it('keeps positions true across a backslash escape', () => {
		const note = 'Some \\*escaped\\* stars and teh mistake here.\n'

		expect(positionOf(note, 'teh')).toEqual({ line: 1, column: 28 })
	})

	it('keeps positions true across a character reference', () => {
		const note = 'A &amp; B &amp; C and teh mistake here.\n'

		expect(positionOf(note, 'teh')).toEqual({ line: 1, column: 23 })
	})

	it('keeps positions true on a later line after an escape', () => {
		const note = 'Escaped \\*stars\\* here.\n\nThe cake was eaten.\n'

		expect(positionOf(note, 'eaten')).toEqual({ line: 3, column: 14 })
	})

	it('keeps positions true across emphasis markers', () => {
		const note = 'This is **truly** the utilise case.\n'

		expect(positionOf(note, 'utilise')).toEqual({ line: 1, column: 23 })
	})
})
