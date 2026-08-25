import { describe, expect, it } from 'vitest'

import { fixedDelimiter } from '@/editor/extensions/formatting/delimiter-spec'

describe('fixedDelimiter', () => {
	it('reports the delimiter length', () => {
		expect(fixedDelimiter('**').length).toBe(2)
	})

	it('matches only the exact delimiter text', () => {
		const spec = fixedDelimiter('**')

		expect(spec.matches('**')).toBe(true)
		expect(spec.matches('~~')).toBe(false)
	})

	it('always resolves to the fixed delimiter regardless of context', () => {
		const spec = fixedDelimiter('~~')

		// @ts-expect-error -- resolveOpen/resolveClose ignore both arguments here.
		expect(spec.resolveOpen()).toBe('~~')
		// @ts-expect-error -- resolveOpen/resolveClose ignore both arguments here.
		expect(spec.resolveClose()).toBe('~~')
	})
})
