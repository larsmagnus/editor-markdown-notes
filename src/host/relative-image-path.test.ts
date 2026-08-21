import { describe, expect, it } from 'vitest'

import { relativeImagePath } from './relative-image-path'

describe('relativeImagePath', () => {
	it('resolves a sibling file with no leading path segment', () => {
		expect(
			relativeImagePath(
				'/workspace/notes/today.md',
				'/workspace/notes/diagram.png'
			)
		).toBe('diagram.png')
	})

	it('resolves a file in a subfolder', () => {
		expect(
			relativeImagePath(
				'/workspace/notes/today.md',
				'/workspace/notes/assets/diagram.png'
			)
		).toBe('assets/diagram.png')
	})

	it('walks up with ../ for a file outside the document folder', () => {
		expect(
			relativeImagePath(
				'/workspace/notes/today.md',
				'/workspace/assets/diagram.png'
			)
		).toBe('../assets/diagram.png')
	})
})
