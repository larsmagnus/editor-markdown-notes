import { describe, expect, it } from 'vitest'

import {
	computeTextStats,
	countParagraphs,
	formatCount,
} from '@/lib/text-tools/document-stats'
import { createEditor } from '@/test-utils/editor'

describe('computeTextStats', () => {
	it('counts words, characters and reading time for a short sentence', () => {
		const stats = computeTextStats(
			'The quick brown fox jumps.',
			'The quick brown fox jumps.'
		)

		expect(stats).toEqual({
			words: 5,
			characters: 26,
			charactersNoSpaces: 22,
			readingTimeMinutes: 1,
		})
	})

	it('returns zeroed stats for empty text', () => {
		const stats = computeTextStats('', '')

		expect(stats).toEqual({
			words: 0,
			characters: 0,
			charactersNoSpaces: 0,
			readingTimeMinutes: 0,
		})
	})

	it('returns zeroed stats for whitespace-only text', () => {
		const stats = computeTextStats('   \n\t  ', '   \n\t  ')

		expect(stats.words).toBe(0)
		expect(stats.readingTimeMinutes).toBe(0)
	})

	it('collapses runs of whitespace between words', () => {
		const stats = computeTextStats('one\n\ntwo   three', 'one\n\ntwo   three')

		expect(stats.words).toBe(3)
	})

	it('rounds reading time up to the nearest minute', () => {
		const words = Array.from({ length: 201 }, () => 'word').join(' ')

		expect(computeTextStats(words, words).readingTimeMinutes).toBe(2)
	})

	it('counts characters from rawText, not from the block-separated text', () => {
		const stats = computeTextStats('one\n\ntwo', 'onetwo')

		expect(stats.characters).toBe(6)
		expect(stats.charactersNoSpaces).toBe(6)
		expect(stats.words).toBe(2)
	})
})

describe('formatCount', () => {
	it('leaves small numbers unchanged', () => {
		expect(formatCount(42)).toBe('42')
	})

	it('adds a thousand separator for numbers in the thousands', () => {
		expect(formatCount(12345)).toBe('12,345')
	})

	it('adds multiple thousand separators for larger numbers', () => {
		expect(formatCount(1234567)).toBe('1,234,567')
	})

	it('formats zero as "0"', () => {
		expect(formatCount(0)).toBe('0')
	})
})

describe('countParagraphs', () => {
	it('counts paragraph nodes in a single-paragraph document', () => {
		const editor = createEditor('Just one paragraph.', { parseOnly: true })

		expect(countParagraphs(editor.state.doc)).toBe(1)
	})

	it('counts paragraph nodes across multiple paragraphs', () => {
		const editor = createEditor(
			'<p>First paragraph.</p><p>Second paragraph.</p><p>Third.</p>',
			{ parseOnly: true }
		)

		expect(countParagraphs(editor.state.doc)).toBe(3)
	})

	it('does not count headings as paragraphs', () => {
		const editor = createEditor('<h1>A heading</h1><p>One paragraph.</p>', {
			parseOnly: true,
		})

		expect(countParagraphs(editor.state.doc)).toBe(1)
	})

	it('returns zero for a document with no paragraphs', () => {
		const editor = createEditor('<h1>Only a heading</h1>', { parseOnly: true })

		expect(countParagraphs(editor.state.doc)).toBe(0)
	})
})
