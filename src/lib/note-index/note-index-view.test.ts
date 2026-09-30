import { describe, expect, it } from 'vitest'

import { filterEntries, sortEntries } from '#src/lib/note-index/note-index-view'
import type { NoteIndexEntry } from '#src/shared/messages'

const roadmap: NoteIndexEntry = {
	uri: 'file:///workspace/docs/planning/roadmap.md',
	fileName: 'roadmap.md',
	directory: 'docs/planning',
	title: 'Quarterly roadmap',
	description: 'Mentions kubernetes',
	tags: ['strategy'],
	modified: 3_000,
	size: 900,
	characters: 900,
	words: 150,
	current: false,
}
const reviewer: NoteIndexEntry = {
	uri: 'file:///workspace/.claude/agents/code-reviewer.md',
	fileName: 'code-reviewer.md',
	directory: '.claude/agents',
	title: 'code-reviewer',
	description: null,
	tags: [],
	modified: 1_000,
	size: 400,
	characters: 400,
	words: 60,
	current: false,
}
const changelog: NoteIndexEntry = {
	uri: 'file:///workspace/CHANGELOG.md',
	fileName: 'CHANGELOG.md',
	directory: '',
	title: 'Changelog',
	description: null,
	tags: [],
	modified: 2_000,
	size: 800,
	characters: 800,
	words: 120,
	current: false,
}
const demoNote: NoteIndexEntry = {
	uri: 'notes.md',
	fileName: 'notes.md',
	directory: '',
	title: 'Notes',
	description: null,
	tags: [],
	modified: null,
	size: 300,
	characters: 300,
	words: 50,
	current: false,
}
const entries = [roadmap, reviewer, changelog]

describe('filterEntries', () => {
	it('returns every entry for an empty query', () => {
		expect(filterEntries(entries, '  ')).toEqual(entries)
	})

	it('matches the title, case-insensitively', () => {
		expect(filterEntries(entries, 'QUARTERLY')).toEqual([roadmap])
	})

	it('matches the file name', () => {
		expect(filterEntries(entries, 'changelog.md')).toEqual([changelog])
	})

	it('matches the directory', () => {
		expect(filterEntries(entries, '.claude')).toEqual([reviewer])
	})

	it('matches a tag', () => {
		expect(filterEntries(entries, 'strategy')).toEqual([roadmap])
	})

	it('does not match the description', () => {
		expect(filterEntries(entries, 'kubernetes')).toEqual([])
	})
})

describe('sortEntries', () => {
	it('sorts by last edited, newest first', () => {
		expect(sortEntries(entries, 'modified')).toEqual([
			roadmap,
			changelog,
			reviewer,
		])
	})

	it('puts entries without a modified time last', () => {
		expect(sortEntries([demoNote, reviewer], 'modified')).toEqual([
			reviewer,
			demoNote,
		])
	})

	it('sorts by title alphabetically, ignoring case', () => {
		expect(sortEntries(entries, 'title')).toEqual([
			changelog,
			reviewer,
			roadmap,
		])
	})

	it('sorts by path', () => {
		expect(sortEntries(entries, 'path')).toEqual([reviewer, changelog, roadmap])
	})

	it('does not mutate its input', () => {
		const input = [...entries]

		sortEntries(input, 'title')

		expect(input).toEqual(entries)
	})
})
