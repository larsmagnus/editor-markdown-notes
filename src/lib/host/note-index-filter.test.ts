import { describe, expect, it } from 'vitest'

import {
	applyNoteIndexFilters,
	countTopLevelDirectories,
	isVisibleNote,
	topLevelDirectory,
} from '#src/lib/host/note-index-filter'

const defaults = {
	respectGitignore: true,
	showAiToolFolders: true,
	hiddenDirectories: [],
}

describe('isVisibleNote', () => {
	it('shows a note git does not ignore', () => {
		expect(isVisibleNote('docs/guide.md', false, defaults)).toBe(true)
	})

	it('hides a gitignored note while respecting .gitignore', () => {
		expect(isVisibleNote('test-results/report.md', true, defaults)).toBe(false)
	})

	it('shows a gitignored note once .gitignore is not respected', () => {
		const filters = { ...defaults, respectGitignore: false }

		expect(isVisibleNote('test-results/report.md', true, filters)).toBe(true)
	})

	it('shows a gitignored AI-tool note while AI-tool folders are shown', () => {
		expect(isVisibleNote('.claude/plans/auth.md', true, defaults)).toBe(true)
	})

	it('hides a gitignored AI-tool note once AI-tool folders are not shown', () => {
		const filters = { ...defaults, showAiToolFolders: false }

		expect(isVisibleNote('.claude/plans/auth.md', true, filters)).toBe(false)
	})

	it('shows an AI-tool note git does not ignore whatever the AI-tool setting', () => {
		const filters = { ...defaults, showAiToolFolders: false }

		expect(isVisibleNote('.claude/commands/review.md', false, filters)).toBe(
			true
		)
	})

	it('hides a note in a directory the user hid', () => {
		const filters = { ...defaults, hiddenDirectories: ['docs'] }

		expect(isVisibleNote('docs/guide.md', false, filters)).toBe(false)
	})

	it('hides a hidden directory even when it is a gitignored AI-tool folder', () => {
		const filters = { ...defaults, hiddenDirectories: ['.claude'] }

		expect(isVisibleNote('.claude/plans/auth.md', true, filters)).toBe(false)
	})

	it('keeps notes at the workspace root when a directory is hidden', () => {
		const filters = { ...defaults, hiddenDirectories: ['docs'] }

		expect(isVisibleNote('README.md', false, filters)).toBe(true)
	})
})

describe('applyNoteIndexFilters', () => {
	const notes = [
		{ relativePath: 'README.md', gitIgnored: false },
		{ relativePath: 'docs/guide.md', gitIgnored: false },
		{ relativePath: 'docs/setup.md', gitIgnored: false },
		{ relativePath: 'test-results/report.md', gitIgnored: true },
		{ relativePath: '.claude/plans/auth.md', gitIgnored: true },
	]

	it('keeps notes that pass every filter', () => {
		const { visible } = applyNoteIndexFilters(notes, defaults)

		expect(visible.map((note) => note.relativePath)).toEqual([
			'README.md',
			'docs/guide.md',
			'docs/setup.md',
			'.claude/plans/auth.md',
		])
	})

	it('lists a hidden directory among the directories, so it can be shown again', () => {
		const { visible, directories } = applyNoteIndexFilters(notes, {
			...defaults,
			hiddenDirectories: ['docs'],
		})

		expect(visible.map((note) => note.relativePath)).not.toContain(
			'docs/guide.md'
		)
		expect(directories).toContainEqual({ directory: 'docs', count: 2 })
	})

	it('leaves gitignored directories out of the directories while .gitignore is respected', () => {
		const { directories } = applyNoteIndexFilters(notes, defaults)

		expect(directories.map(({ directory }) => directory)).not.toContain(
			'test-results'
		)
	})

	it('lists a gitignored directory once .gitignore is not respected', () => {
		const { directories } = applyNoteIndexFilters(notes, {
			...defaults,
			respectGitignore: false,
		})

		expect(directories).toContainEqual({ directory: 'test-results', count: 1 })
	})
})

describe('topLevelDirectory', () => {
	it('is the first segment of a nested path', () => {
		expect(topLevelDirectory('docs/guides/setup.md')).toBe('docs')
	})

	it('is empty for a note at the workspace root', () => {
		expect(topLevelDirectory('README.md')).toBe('')
	})
})

describe('countTopLevelDirectories', () => {
	it('counts notes per top-level directory, most notes first', () => {
		const counts = countTopLevelDirectories([
			'docs/a.md',
			'docs/guides/b.md',
			'notes/c.md',
			'docs/d.md',
		])

		expect(counts).toEqual([
			{ directory: 'docs', count: 3 },
			{ directory: 'notes', count: 1 },
		])
	})

	it('leaves notes at the workspace root out of the list', () => {
		expect(countTopLevelDirectories(['README.md', 'docs/a.md'])).toEqual([
			{ directory: 'docs', count: 1 },
		])
	})

	it('orders directories with equal counts alphabetically', () => {
		expect(
			countTopLevelDirectories(['notes/a.md', 'docs/b.md', 'archive/c.md'])
		).toEqual([
			{ directory: 'archive', count: 1 },
			{ directory: 'docs', count: 1 },
			{ directory: 'notes', count: 1 },
		])
	})
})
