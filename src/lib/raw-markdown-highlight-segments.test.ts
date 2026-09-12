import { describe, expect, it } from 'vitest'

import { buildHighlightSegments } from '#src/lib/raw-markdown-highlight-segments'

describe('buildHighlightSegments', () => {
	it('returns one plain segment for text with no tokens', () => {
		expect(buildHighlightSegments('# Heading', [])).toEqual([
			{ text: '# Heading' },
		])
	})

	it('returns nothing for empty text', () => {
		expect(buildHighlightSegments('', [])).toEqual([])
	})

	it('colors a single token in the middle of the text', () => {
		expect(
			buildHighlightSegments('Some **bold** text', [
				{ offset: 5, length: 8, color: '#ff7b72' },
			])
		).toEqual([
			{ text: 'Some ' },
			{ text: '**bold**', style: { color: '#ff7b72' } },
			{ text: ' text' },
		])
	})

	it('colors adjacent tokens with no gap between them', () => {
		expect(
			buildHighlightSegments('ab', [
				{ offset: 0, length: 1, color: '#ff7b72' },
				{ offset: 1, length: 1, color: '#79c0ff' },
			])
		).toEqual([
			{ text: 'a', style: { color: '#ff7b72' } },
			{ text: 'b', style: { color: '#79c0ff' } },
		])
	})

	it('colors a token that starts at the very beginning of the text', () => {
		expect(
			buildHighlightSegments('# Heading', [
				{ offset: 0, length: 1, color: '#ff7b72' },
			])
		).toEqual([
			{ text: '#', style: { color: '#ff7b72' } },
			{ text: ' Heading' },
		])
	})

	it('colors a token that ends at the very end of the text', () => {
		expect(
			buildHighlightSegments('plain bold', [
				{ offset: 6, length: 4, color: '#ff7b72' },
			])
		).toEqual([
			{ text: 'plain ' },
			{ text: 'bold', style: { color: '#ff7b72' } },
		])
	})

	it('carries font style onto the token segment', () => {
		expect(
			buildHighlightSegments('bold', [
				{ offset: 0, length: 4, color: '#ff7b72', fontStyle: 2 },
			])
		).toEqual([
			{ text: 'bold', style: { color: '#ff7b72', fontWeight: 'bold' } },
		])
	})

	it('marks a link range with its index, alongside plain text', () => {
		const source = 'See [notes](./notes.md) for details.'
		expect(
			buildHighlightSegments(
				source,
				[],
				[{ href: './notes.md', linkStart: 4, parensStart: 12, parensEnd: 22 }]
			)
		).toEqual([
			{ text: 'See [notes](' },
			{ text: './notes.md', linkRangeIndex: 0 },
			{ text: ') for details.' },
		])
	})

	it('carries both a token style and a link range index on the same segment', () => {
		const source = '[notes](./notes.md)'
		expect(
			buildHighlightSegments(
				source,
				[{ offset: 8, length: 10, color: '#79c0ff' }],
				[{ href: './notes.md', linkStart: 0, parensStart: 8, parensEnd: 18 }]
			)
		).toEqual([
			{ text: '[notes](' },
			{ text: './notes.md', style: { color: '#79c0ff' }, linkRangeIndex: 0 },
			{ text: ')' },
		])
	})

	it('underlines an issue range with its severity class and tooltip', () => {
		const source = 'We recieved the report.'
		expect(
			buildHighlightSegments(
				source,
				[],
				[],
				[
					{
						ruleId: 'spelling',
						severity: 'misspelling',
						message: 'Misspelled',
						actual: 'recieved',
						expected: ['received'],
						start: 0,
						end: 0,
						from: 3,
						to: 11,
					},
				]
			)
		).toEqual([
			{ text: 'We ' },
			{
				text: 'recieved',
				className: 'text-tools-issue text-tools-issue--misspelling',
				title: 'Misspelled (try: received)',
			},
			{ text: ' the report.' },
		])
	})

	it('picks the narrowest issue when two overlap', () => {
		const source = 'The report was written by the committee.'
		expect(
			buildHighlightSegments(
				source,
				[],
				[],
				[
					{
						ruleId: 'readability',
						severity: 'hard',
						message: 'Hard to read',
						actual: source,
						expected: [],
						start: 0,
						end: 0,
						from: 0,
						to: source.length,
					},
					{
						ruleId: 'passive',
						severity: 'warning',
						message: 'Passive voice',
						actual: 'written',
						expected: [],
						start: 0,
						end: 0,
						from: 15,
						to: 22,
					},
				]
			)
		).toEqual([
			{
				text: 'The report was ',
				className: 'text-tools-issue text-tools-issue--hard',
				title: 'Hard to read',
			},
			{
				text: 'written',
				className: 'text-tools-issue text-tools-issue--warning',
				title: 'Passive voice',
			},
			{
				text: ' by the committee.',
				className: 'text-tools-issue text-tools-issue--hard',
				title: 'Hard to read',
			},
		])
	})

	it('marks more than one link range with its own index', () => {
		const source = '[a](./a.md) and [b](./b.md)'
		expect(
			buildHighlightSegments(
				source,
				[],
				[
					{ href: './a.md', linkStart: 0, parensStart: 4, parensEnd: 10 },
					{ href: './b.md', linkStart: 16, parensStart: 20, parensEnd: 26 },
				]
			)
		).toEqual([
			{ text: '[a](' },
			{ text: './a.md', linkRangeIndex: 0 },
			{ text: ') and [b](' },
			{ text: './b.md', linkRangeIndex: 1 },
			{ text: ')' },
		])
	})
})
