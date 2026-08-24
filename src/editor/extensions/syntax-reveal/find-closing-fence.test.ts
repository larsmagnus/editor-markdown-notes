import { describe, expect, it } from 'vitest'

import { findClosingFence } from '@/editor/extensions/syntax-reveal/find-closing-fence'

describe('findClosingFence', () => {
	it('finds a closing marker on a line of its own', () => {
		expect(findClosingFence('const a = 1\n```', '```')).toBe(11)
	})

	it('finds a closing marker that immediately follows the opening line', () => {
		expect(findClosingFence('```', '```')).toBe(0)
	})

	it('returns null when no closing marker is present', () => {
		expect(findClosingFence('const a = 1', '```')).toBeNull()
	})

	it('allows trailing whitespace after the marker', () => {
		expect(findClosingFence('const a = 1\n```  ', '```')).toBe(11)
	})

	it('does not match a marker that is not alone on its line', () => {
		expect(findClosingFence('const a = 1\n``` extra', '```')).toBeNull()
	})

	it('works with a non-backtick marker', () => {
		expect(findClosingFence('name: notes\n---', '---')).toBe(11)
	})
})
