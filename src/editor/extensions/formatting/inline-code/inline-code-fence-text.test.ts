import { describe, expect, it } from 'vitest'

import { inlineCodeFenceText } from '@/editor/extensions/formatting/inline-code/inline-code-fence-text'

describe('inlineCodeFenceText', () => {
	it('uses a plain single backtick on both ends when the text has none of its own', () => {
		expect(inlineCodeFenceText('helloWorld()')).toEqual({
			open: '`',
			close: '`',
		})
	})

	it('pads the fence with a space on each side when the text contains a backtick', () => {
		expect(inlineCodeFenceText('a`b')).toEqual({
			open: '`` ',
			close: ' ``',
		})
	})

	it('picks the shortest fence not already present as a run in the text', () => {
		expect(inlineCodeFenceText('a``b')).toEqual({
			open: '` ',
			close: ' `',
		})
	})
})
