import { describe, expect, it } from 'vitest'

import { isInsideFolder, resolveCopyFilename } from './image-copy'

describe('isInsideFolder', () => {
	it('is true for a file directly inside the folder', () => {
		expect(isInsideFolder('/workspace/notes/today.md', '/workspace')).toBe(true)
	})

	it('is true for a file several levels deep inside the folder', () => {
		expect(
			isInsideFolder('/workspace/notes/assets/diagram.png', '/workspace')
		).toBe(true)
	})

	it('is true for the folder itself', () => {
		expect(isInsideFolder('/workspace', '/workspace')).toBe(true)
	})

	it('is false for a sibling folder that shares a name prefix', () => {
		expect(isInsideFolder('/workspace-other/img.png', '/workspace')).toBe(false)
	})

	it('is false for a file outside the folder entirely', () => {
		expect(isInsideFolder('/Users/dev/Desktop/img.png', '/workspace')).toBe(
			false
		)
	})
})

describe('resolveCopyFilename', () => {
	it('keeps the original name when nothing exists yet', async () => {
		expect(await resolveCopyFilename('diagram.png', async () => false)).toBe(
			'diagram.png'
		)
	})

	it('adds a numeric suffix on the first collision', async () => {
		const exists = async (name: string) => name === 'diagram.png'

		expect(await resolveCopyFilename('diagram.png', exists)).toBe(
			'diagram-1.png'
		)
	})

	it('keeps incrementing the suffix past multiple collisions', async () => {
		const taken = new Set(['diagram.png', 'diagram-1.png', 'diagram-2.png'])
		const exists = async (name: string) => taken.has(name)

		expect(await resolveCopyFilename('diagram.png', exists)).toBe(
			'diagram-3.png'
		)
	})

	it('preserves the extension when suffixing', async () => {
		const exists = async (name: string) => name === 'photo.jpeg'

		expect(await resolveCopyFilename('photo.jpeg', exists)).toBe('photo-1.jpeg')
	})
})
