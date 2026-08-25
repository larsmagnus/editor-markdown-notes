import { describe, expect, it } from 'vitest'

import { fixedDelimiter } from '@/editor/extensions/formatting/delimiter-spec'

describe('fixedDelimiter', () => {
	it('detects the delimiter length at the start of matching text', () => {
		expect(fixedDelimiter('**').detectOpen('**bold**')).toBe(2)
	})

	it('reports no opening delimiter when the text starts with something else', () => {
		expect(fixedDelimiter('**').detectOpen('~~bold~~')).toBe(0)
	})

	it('detects the delimiter length at the end of matching text', () => {
		expect(fixedDelimiter('**').detectClose('**bold**')).toBe(2)
	})

	it('reports no closing delimiter when the text ends with something else', () => {
		expect(fixedDelimiter('**').detectClose('**bold~~')).toBe(0)
	})

	it('always resolves to the fixed delimiter regardless of context', () => {
		const spec = fixedDelimiter('~~')

		// @ts-expect-error -- resolveOpen/resolveClose ignore both arguments here.
		expect(spec.resolveOpen()).toBe('~~')
		// @ts-expect-error -- resolveOpen/resolveClose ignore both arguments here.
		expect(spec.resolveClose()).toBe('~~')
	})
})
