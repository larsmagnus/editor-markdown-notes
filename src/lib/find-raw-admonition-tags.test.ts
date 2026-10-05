import { describe, expect, it } from 'vitest'

import { findRawAdmonitionTags } from '#src/lib/find-raw-admonition-tags'

describe('findRawAdmonitionTags', () => {
	it.each(['note', 'tip', 'important', 'warning', 'caution'])(
		'finds a %s tag line',
		(type) => {
			const tag = `[!${type.toUpperCase()}]`
			const source = `Intro\n\n> ${tag}\n> Body`

			expect(findRawAdmonitionTags(source)).toEqual([
				{ from: 9, to: 9 + tag.length, type },
			])
		}
	)

	it('ignores a tag with text after it on the line', () => {
		expect(findRawAdmonitionTags('> [!NOTE] Body')).toEqual([])
	})

	it('ignores an unknown type', () => {
		expect(findRawAdmonitionTags('> [!FOO]')).toEqual([])
	})

	it('ignores a tag outside a quote', () => {
		expect(findRawAdmonitionTags('[!NOTE]')).toEqual([])
	})

	it('finds a tag on a CRLF line', () => {
		expect(findRawAdmonitionTags('> [!NOTE]\r\n> Body')).toEqual([
			{ from: 2, to: 9, type: 'note' },
		])
	})

	it('ignores a tag inside a fenced code block', () => {
		expect(findRawAdmonitionTags('```md\n> [!NOTE]\n```')).toEqual([])
	})

	it('finds a tag after a fenced code block closes', () => {
		expect(findRawAdmonitionTags('```md\n> [!NOTE]\n```\n\n> [!TIP]')).toEqual([
			{ from: 23, to: 29, type: 'tip' },
		])
	})
})
