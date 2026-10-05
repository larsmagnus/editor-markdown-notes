import { describe, expect, it } from 'vitest'

import {
	isGitIgnored,
	parseGitIgnoredPaths,
} from '#src/lib/host/git-ignored-paths'

describe('parseGitIgnoredPaths', () => {
	it('reads NUL-separated entries', () => {
		const ignored = parseGitIgnoredPaths('test-results/\0notes/scratch.md\0')

		expect(isGitIgnored('test-results/report.md', ignored)).toBe(true)
		expect(isGitIgnored('notes/scratch.md', ignored)).toBe(true)
	})

	it('ignores empty output', () => {
		const ignored = parseGitIgnoredPaths('')

		expect(isGitIgnored('README.md', ignored)).toBe(false)
	})
})

describe('isGitIgnored', () => {
	it('matches every file below an ignored directory', () => {
		const ignored = parseGitIgnoredPaths('test-results/\0')

		expect(isGitIgnored('test-results/a/b/c.md', ignored)).toBe(true)
	})

	it('matches an ignored directory nested below the root', () => {
		const ignored = parseGitIgnoredPaths('packages/web/test-results/\0')

		expect(isGitIgnored('packages/web/test-results/report.md', ignored)).toBe(
			true
		)
	})

	it('matches an ignored file by its exact path only', () => {
		const ignored = parseGitIgnoredPaths('notes/scratch.md\0')

		expect(isGitIgnored('notes/scratch.md', ignored)).toBe(true)
		expect(isGitIgnored('notes/scratch.md.bak', ignored)).toBe(false)
		expect(isGitIgnored('other/notes/scratch.md', ignored)).toBe(false)
	})

	it('does not match a sibling that merely shares a prefix', () => {
		const ignored = parseGitIgnoredPaths('test-results/\0')

		expect(isGitIgnored('test-results-archive/report.md', ignored)).toBe(false)
	})

	it('leaves tracked and untracked-but-unignored files alone', () => {
		const ignored = parseGitIgnoredPaths('test-results/\0')

		expect(isGitIgnored('docs/guide.md', ignored)).toBe(false)
	})
})
