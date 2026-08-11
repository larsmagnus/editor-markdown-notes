import { describe, expect, it } from 'vitest'

import { looksLikeBlockMarkdown } from '@/editor/looks-like-block-markdown'

describe('text that is worth parsing as markdown', () => {
	it('recognises a table by its delimiter row', () => {
		const table = ['| Quarter | Revenue |', '| --- | ---: |', '| Q1 | 1.2M |']

		expect(looksLikeBlockMarkdown(table.join('\n'))).toBe(true)
	})

	it('recognises a bullet list', () => {
		expect(looksLikeBlockMarkdown('- Tables\n- Footnotes')).toBe(true)
	})

	it('recognises an ordered list', () => {
		expect(looksLikeBlockMarkdown('1. Tables\n2. Footnotes')).toBe(true)
	})

	it('recognises a heading', () => {
		expect(looksLikeBlockMarkdown('## Release notes')).toBe(true)
	})

	it('recognises a fenced code block', () => {
		expect(looksLikeBlockMarkdown('```ts\nconst revenue = 1\n```')).toBe(true)
	})

	it('recognises a blockquote', () => {
		expect(looksLikeBlockMarkdown('> Revenue is up')).toBe(true)
	})

	it('recognises a thematic break', () => {
		expect(
			looksLikeBlockMarkdown('Revenue is up\n\n---\n\nGrowth is flat')
		).toBe(true)
	})

	it('recognises a block that follows a plain paragraph', () => {
		expect(
			looksLikeBlockMarkdown('Two quarters:\n\n- Q1 2025\n- Q2 2025')
		).toBe(true)
	})
})

describe('text that should be pasted as it stands', () => {
	// The whole reason for the check: markdown-it reads `*= b *` as emphasis and
	// the asterisks never reach the document.
	it('leaves a line of code alone', () => {
		expect(looksLikeBlockMarkdown('a *= b * c')).toBe(false)
	})

	it('leaves prose with inline emphasis alone', () => {
		expect(looksLikeBlockMarkdown('Revenue is **up** this quarter')).toBe(false)
	})

	it('leaves a snake_case identifier alone', () => {
		expect(looksLikeBlockMarkdown('const total_revenue = sum(rows)')).toBe(
			false
		)
	})

	it('leaves a multi-line log alone', () => {
		const log = ['INFO  build started', 'WARN  2 unused exports']

		expect(looksLikeBlockMarkdown(log.join('\n'))).toBe(false)
	})

	// A row on its own is a paragraph in GFM too, so reading it as a table would
	// be the same overreach as the emphasis above.
	it('leaves a lone pipe-separated row alone', () => {
		expect(looksLikeBlockMarkdown('| Quarter | Revenue |')).toBe(false)
	})

	it('leaves a subtraction alone', () => {
		expect(looksLikeBlockMarkdown('revenue - costs')).toBe(false)
	})

	it('leaves an empty string alone', () => {
		expect(looksLikeBlockMarkdown('')).toBe(false)
	})
})
