import retextEnglish from 'retext-english'
import { unified } from 'unified'
import { VFile } from 'vfile'
import { describe, expect, it } from 'vitest'

import { textRangesOf } from '#src/lib/text-tools/text-ranges-of'

describe('textRangesOf', () => {
	it('collects each word with its own text and offset range', () => {
		const text = 'Two words.'
		const tree = unified().use(retextEnglish).parse(new VFile(text))

		const words = textRangesOf(tree, 'WordNode')

		expect(words).toEqual([
			{ text: 'Two', start: 0, end: 3 },
			{ text: 'words', start: 4, end: 9 },
		])
	})

	it('collects each sentence with its own text and offset range', () => {
		const text = 'One fish. Two fish.'
		const tree = unified().use(retextEnglish).parse(new VFile(text))

		const sentences = textRangesOf(tree, 'SentenceNode')

		expect(sentences).toEqual([
			{ text: 'One fish.', start: 0, end: 9 },
			{ text: 'Two fish.', start: 10, end: 19 },
		])
	})

	it('returns nothing for a node type that never occurs', () => {
		const text = 'One fish.'
		const tree = unified().use(retextEnglish).parse(new VFile(text))

		expect(textRangesOf(tree, 'ParenthesisNode')).toEqual([])
	})
})
