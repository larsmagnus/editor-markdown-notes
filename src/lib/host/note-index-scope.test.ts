import { describe, expect, it } from 'vitest'

import {
	buildNoteIndexExclude,
	keepNewest,
} from '#src/lib/host/note-index-scope'

function excludedPatterns(exclude: string): string[] {
	return exclude.slice(1, -1).split(',')
}

describe('buildNoteIndexExclude', () => {
	it('excludes dependency, VCS and build directories by default', () => {
		const patterns = excludedPatterns(buildNoteIndexExclude({}, []))

		expect(patterns).toEqual(
			expect.arrayContaining([
				'**/node_modules/**',
				'**/.git/**',
				'**/dist/**',
				'**/out/**',
				'**/.venv/**',
			])
		)
	})

	it.each([
		['test-results'],
		['playwright-report'],
		['.nyc_output'],
		['.pytest_cache'],
	])('excludes the %s tool output directory by default', (directory) => {
		const patterns = excludedPatterns(buildNoteIndexExclude({}, []))

		expect(patterns).toContain(`**/${directory}/**`)
	})

	it('leaves dot-directories that hold notes, such as .claude, in scope', () => {
		const patterns = excludedPatterns(buildNoteIndexExclude({}, []))

		expect(patterns.some((pattern) => pattern.includes('.claude'))).toBe(false)
		expect(patterns).not.toContain('**/.*/**')
	})

	it('adds the enabled files.exclude patterns', () => {
		const patterns = excludedPatterns(
			buildNoteIndexExclude({ '**/archive': true, '**/drafts': false }, [])
		)

		expect(patterns).toContain('**/archive')
		expect(patterns).not.toContain('**/drafts')
	})

	it('expands a files.exclude brace group rather than nesting it', () => {
		const patterns = excludedPatterns(
			buildNoteIndexExclude({ '**/*.{js,map}': true }, [])
		)

		expect(patterns).toContain('**/*.js')
		expect(patterns).toContain('**/*.map')
		expect(patterns.join(',')).not.toMatch(/\{[^}]*\{/)
	})

	it('expands every brace group in a pattern', () => {
		const patterns = excludedPatterns(
			buildNoteIndexExclude({}, ['{docs,notes}/*.{md,txt}'])
		)

		expect(patterns).toEqual(
			expect.arrayContaining([
				'docs/*.md',
				'docs/*.txt',
				'notes/*.md',
				'notes/*.txt',
			])
		)
	})

	it('skips files.exclude patterns with a sibling condition', () => {
		const patterns = excludedPatterns(
			buildNoteIndexExclude({ '**/*.js': { when: '$(basename).ts' } }, [])
		)

		expect(patterns).not.toContain('**/*.js')
	})

	it('adds the user-configured index excludes', () => {
		const patterns = excludedPatterns(
			buildNoteIndexExclude({}, ['**/journal/**', 'CHANGELOG.md'])
		)

		expect(patterns).toContain('**/journal/**')
		expect(patterns).toContain('CHANGELOG.md')
	})

	it('ignores malformed configuration values', () => {
		const exclude = buildNoteIndexExclude('not-an-object', [42, null, ''])

		expect(excludedPatterns(exclude)).toEqual(
			excludedPatterns(buildNoteIndexExclude({}, []))
		)
	})
})

describe('keepNewest', () => {
	it('keeps the most recently modified files, newest first', () => {
		const files = [
			{ path: 'archive/2019.md', mtime: 1_000 },
			{ path: 'today.md', mtime: 9_000 },
			{ path: 'yesterday.md', mtime: 8_000 },
		]

		expect(keepNewest(files, 2)).toEqual([
			{ path: 'today.md', mtime: 9_000 },
			{ path: 'yesterday.md', mtime: 8_000 },
		])
	})

	it('keeps every file when there are fewer than the limit', () => {
		const files = [
			{ path: 'a.md', mtime: 1_000 },
			{ path: 'b.md', mtime: 2_000 },
		]

		expect(keepNewest(files, 2_000)).toHaveLength(2)
	})

	it('leaves its input in order', () => {
		const files = [
			{ path: 'a.md', mtime: 1_000 },
			{ path: 'b.md', mtime: 2_000 },
		]

		keepNewest(files, 1)

		expect(files.map((file) => file.path)).toEqual(['a.md', 'b.md'])
	})
})
