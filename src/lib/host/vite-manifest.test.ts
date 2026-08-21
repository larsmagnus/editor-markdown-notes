import { describe, expect, it } from 'vitest'

import { resolveEntryChunk } from '@/lib/host/vite-manifest'

describe('resolveEntryChunk', () => {
	it('finds the entry and its own stylesheets', () => {
		const entry = resolveEntryChunk({
			'index.html': {
				file: 'assets/index-a1b2c3.js',
				css: ['assets/index-d4e5f6.css'],
			},
		})

		expect(entry).toEqual({
			file: 'assets/index-a1b2c3.js',
			css: ['assets/index-d4e5f6.css'],
			imports: [],
		})
	})

	/** A chunk's stylesheets hang off that chunk, not off the entry. */
	it('collects the stylesheets an imported chunk brings with it', () => {
		const entry = resolveEntryChunk({
			'index.html': {
				file: 'assets/index-a1b2c3.js',
				css: ['assets/index-d4e5f6.css'],
				imports: ['src/vendor.ts'],
			},
			'src/vendor.ts': {
				file: 'assets/vendor-99aabb.js',
				css: ['assets/vendor-77ccdd.css'],
			},
		})

		expect(entry?.imports).toEqual(['assets/vendor-99aabb.js'])
		expect(entry?.css).toEqual([
			'assets/index-d4e5f6.css',
			'assets/vendor-77ccdd.css',
		])
	})

	it('walks imports of imports', () => {
		const entry = resolveEntryChunk({
			'index.html': { file: 'assets/index.js', imports: ['src/a.ts'] },
			'src/a.ts': { file: 'assets/a.js', imports: ['src/b.ts'] },
			'src/b.ts': { file: 'assets/b.js', imports: ['src/c.ts'] },
			'src/c.ts': { file: 'assets/c.js' },
		})

		expect(entry?.imports).toEqual([
			'assets/a.js',
			'assets/b.js',
			'assets/c.js',
		])
	})

	it('terminates on a cycle between two chunks', () => {
		const entry = resolveEntryChunk({
			'index.html': { file: 'assets/index.js', imports: ['src/a.ts'] },
			'src/a.ts': { file: 'assets/a.js', imports: ['src/b.ts'] },
			'src/b.ts': { file: 'assets/b.js', imports: ['src/a.ts'] },
		})

		expect(entry?.imports).toEqual(['assets/a.js', 'assets/b.js'])
	})

	// Depth-first: `a` and everything it pulls in, then `b`.
	it('lists a chunk reached by two different paths only once', () => {
		const entry = resolveEntryChunk({
			'index.html': {
				file: 'assets/index.js',
				imports: ['src/a.ts', 'src/b.ts'],
			},
			'src/a.ts': { file: 'assets/a.js', imports: ['src/shared.ts'] },
			'src/b.ts': { file: 'assets/b.js', imports: ['src/shared.ts'] },
			'src/shared.ts': { file: 'assets/shared.js' },
		})

		expect(entry?.imports).toEqual([
			'assets/a.js',
			'assets/shared.js',
			'assets/b.js',
		])
	})

	it('skips an import the manifest has no chunk for', () => {
		const entry = resolveEntryChunk({
			'index.html': { file: 'assets/index.js', imports: ['src/missing.ts'] },
		})

		expect(entry?.imports).toEqual([])
	})

	it('has nothing to load without an index.html entry', () => {
		expect(
			resolveEntryChunk({ 'src/main.tsx': { file: 'assets/main.js' } })
		).toBe(undefined)
	})

	it('has nothing to load when the entry names no file', () => {
		expect(resolveEntryChunk({ 'index.html': { css: ['assets/x.css'] } })).toBe(
			undefined
		)
	})

	it('has nothing to load from an empty manifest', () => {
		expect(resolveEntryChunk({})).toBe(undefined)
	})
})
