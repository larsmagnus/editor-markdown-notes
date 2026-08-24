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

	// Regression: `$` without the `m` flag only matches the very end of the
	// whole string, so a block with one more newline typed after its closing
	// fence (still inside the block - pressing Enter there inserts `\n`, it
	// doesn't leave it) used to report no closing fence at all.
	it('finds the closing marker even with a trailing newline after it', () => {
		expect(findClosingFence('const a = 1\n```\n', '```')).toBe(11)
	})

	it('finds the closing marker even with multiple trailing newlines after it', () => {
		expect(findClosingFence('const a = 1\n```\n\n', '```')).toBe(11)
	})
})
