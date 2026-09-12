import { describe, expect, it } from 'vitest'

import { getMarkdownSourceText } from '#src/lib/text-tools/markdown-source-text'
import { placeSourceIssues } from '#src/lib/text-tools/place-source-issues'
import type { TextIssue } from '#src/lib/text-tools/types'

function issue(overrides: Partial<TextIssue>): TextIssue {
	return {
		ruleId: 'spelling',
		severity: 'misspelling',
		message: 'Misspelled',
		actual: '',
		expected: [],
		start: 0,
		end: 0,
		...overrides,
	}
}

describe('placeSourceIssues', () => {
	it('maps an issue onto its raw markdown source range', () => {
		const markdown = 'The report was written.'
		const markdownSourceText = getMarkdownSourceText(markdown)
		const start = markdownSourceText.text.indexOf('written')

		const [placed] = placeSourceIssues(
			[issue({ start, end: start + 'written'.length })],
			markdownSourceText,
			new Set(['spelling'])
		)

		expect(placed).toBeDefined()
		expect(markdown.slice(placed.from, placed.to)).toBe('written')
	})

	it('drops an issue whose rule is not enabled', () => {
		const markdown = 'The report was written.'
		const markdownSourceText = getMarkdownSourceText(markdown)

		const placed = placeSourceIssues(
			[issue({ start: 0, end: 3 })],
			markdownSourceText,
			new Set(['readability'])
		)

		expect(placed).toEqual([])
	})

	it('places an issue after a skipped code block at its real source offset', () => {
		const markdown = 'Before.\n\n```js\nconst x = 1\n```\n\nAfter the code.'
		const markdownSourceText = getMarkdownSourceText(markdown)
		const start = markdownSourceText.text.indexOf('After')

		const [placed] = placeSourceIssues(
			[issue({ start, end: start + 'After'.length })],
			markdownSourceText,
			new Set(['spelling'])
		)

		expect(placed).toBeDefined()
		expect(markdown.slice(placed.from, placed.to)).toBe('After')
	})
})
