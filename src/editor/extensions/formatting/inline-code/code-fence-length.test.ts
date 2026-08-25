import { describe, expect, it } from 'vitest'

import { codeFenceLength } from '@/editor/extensions/formatting/inline-code/code-fence-length'

describe('codeFenceLength', () => {
	it('returns one for text with no backticks at all', () => {
		expect(codeFenceLength('plain text')).toBe(1)
	})

	it('returns two when the text itself contains a single backtick', () => {
		expect(codeFenceLength('a`b')).toBe(2)
	})

	it('skips a run length the text already uses, not the longest one', () => {
		// A run of 4 backticks is present, but 1 is still unused and shorter.
		expect(codeFenceLength('````mermaid')).toBe(1)
	})

	it('picks the shortest length absent from every run present', () => {
		expect(codeFenceLength('a`b``c')).toBe(3)
	})
})
