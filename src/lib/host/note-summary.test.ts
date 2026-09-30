import { describe, expect, it } from 'vitest'

import { summarizeNote } from '#src/lib/host/note-summary'

describe('summarizeNote title', () => {
	it('prefers a frontmatter title over the h1', () => {
		const markdown = [
			'---',
			'title: Quarterly roadmap',
			'---',
			'',
			'# Roadmap draft',
		].join('\n')

		expect(summarizeNote(markdown, 'roadmap.md').title).toBe(
			'Quarterly roadmap'
		)
	})

	it('falls back to a frontmatter name when there is no title', () => {
		const markdown = [
			'---',
			'name: code-reviewer',
			'description: Reviews diffs',
			'---',
			'',
			'# Instructions',
		].join('\n')

		expect(summarizeNote(markdown, 'code-reviewer.md').title).toBe(
			'code-reviewer'
		)
	})

	it('strips quotes around a frontmatter title', () => {
		const markdown = ['---', 'title: "Meeting: kickoff"', '---'].join('\n')

		expect(summarizeNote(markdown, 'kickoff.md').title).toBe('Meeting: kickoff')
	})

	it('uses the first h1 when the frontmatter has no title or name', () => {
		const markdown = [
			'---',
			'status: draft',
			'---',
			'',
			'Some intro text.',
			'',
			'# Release checklist',
		].join('\n')

		expect(summarizeNote(markdown, 'release.md').title).toBe(
			'Release checklist'
		)
	})

	it('uses a setext h1', () => {
		const markdown = [
			'Release checklist',
			'=================',
			'',
			'Body',
		].join('\n')

		expect(summarizeNote(markdown, 'release.md').title).toBe(
			'Release checklist'
		)
	})

	it('skips an earlier h2 in favour of the h1', () => {
		const markdown = ['## Background', '', '# Release process'].join('\n')

		expect(summarizeNote(markdown, 'notes.md').title).toBe('Release process')
	})

	it('falls back to an h2 as plain text when there is no h1', () => {
		const markdown = ['## Background', '', 'We ship on Fridays.'].join('\n')

		expect(summarizeNote(markdown, 'notes.md').title).toBe('Background')
	})

	it('ignores a # line inside a fenced code block', () => {
		const markdown = [
			'```bash',
			'# install dependencies',
			'```',
			'',
			'# Setup guide',
		].join('\n')

		expect(summarizeNote(markdown, 'setup.md').title).toBe('Setup guide')
	})

	it('strips inline formatting and closing hashes from the h1', () => {
		const markdown = '# The **new** [editor](https://example.com) `v2` #'

		expect(summarizeNote(markdown, 'notes.md').title).toBe('The new editor v2')
	})

	it('falls back to the first line of plain text without markup', () => {
		const markdown = ['- Buy **oat milk** for the office', '- Book room'].join(
			'\n'
		)

		expect(summarizeNote(markdown, 'todo.md').title).toBe(
			'Buy oat milk for the office'
		)
	})

	it('truncates long plain text at a word boundary', () => {
		const sentence =
			'This is a rather long opening paragraph that keeps going well past the point where any card could reasonably show it in full'

		const { title } = summarizeNote(sentence, 'long.md')

		expect(title.endsWith('…')).toBe(true)
		expect(title.length).toBeLessThanOrEqual(81)
		expect(sentence.startsWith(title.slice(0, -1))).toBe(true)
		expect(title.at(-2)).not.toBe(' ')
	})

	it('reads a note saved with Windows line endings', () => {
		const markdown = [
			'---',
			'status: draft',
			'---',
			'',
			'Release checklist',
			'=====',
		].join('\r\n')

		expect(summarizeNote(markdown, 'release.md').title).toBe(
			'Release checklist'
		)
	})

	it('falls back to the file name for an empty note', () => {
		expect(summarizeNote('', 'empty-note.md').title).toBe('empty-note.md')
	})

	it('falls back to the file name for a frontmatter-only note', () => {
		const markdown = ['---', 'status: draft', '---'].join('\n')

		expect(summarizeNote(markdown, 'draft.md').title).toBe('draft.md')
	})
})

describe('summarizeNote frontmatter fields', () => {
	it('reads tags written as an inline list', () => {
		const markdown = ['---', 'tags: [planning, "q3"]', '---'].join('\n')

		expect(summarizeNote(markdown, 'plan.md').tags).toEqual(['planning', 'q3'])
	})

	it('reads tags written as a block list', () => {
		const markdown = ['---', 'tags:', '  - planning', '  - q3', '---'].join(
			'\n'
		)

		expect(summarizeNote(markdown, 'plan.md').tags).toEqual(['planning', 'q3'])
	})

	it('reads tags written as an unindented block list', () => {
		const markdown = ['---', 'tags:', '- planning', '- q3', '---'].join('\n')

		expect(summarizeNote(markdown, 'plan.md').tags).toEqual(['planning', 'q3'])
	})

	it('treats a block scalar description as absent rather than as its indicator', () => {
		const markdown = [
			'---',
			'description: >-',
			'  Reviews diffs',
			'  for bugs',
			'---',
		].join('\n')

		expect(summarizeNote(markdown, 'agent.md').description).toBeNull()
	})

	it('falls through a block scalar title to the h1', () => {
		const markdown = [
			'---',
			'title: |',
			'  Roadmap',
			'---',
			'',
			'# Roadmap draft',
		].join('\n')

		expect(summarizeNote(markdown, 'roadmap.md').title).toBe('Roadmap draft')
	})

	it('reads tags written as a comma-separated string', () => {
		const markdown = ['---', 'tags: planning, q3', '---'].join('\n')

		expect(summarizeNote(markdown, 'plan.md').tags).toEqual(['planning', 'q3'])
	})

	it('reads the description', () => {
		const markdown = [
			'---',
			"description: 'Reviews diffs for bugs'",
			'---',
		].join('\n')

		expect(summarizeNote(markdown, 'agent.md').description).toBe(
			'Reviews diffs for bugs'
		)
	})

	it('has no tags or description without frontmatter', () => {
		const summary = summarizeNote('# Notes', 'notes.md')

		expect(summary.tags).toEqual([])
		expect(summary.description).toBeNull()
	})
})

describe('summarizeNote counts', () => {
	it('counts the characters and words of the body, not the frontmatter', () => {
		const markdown = [
			'---',
			'title: Greeting',
			'---',
			'',
			'Hello there world',
		].join('\n')

		const summary = summarizeNote(markdown, 'greeting.md')

		expect(summary.characters).toBe('Hello there world'.length)
		expect(summary.words).toBe(3)
	})

	it('counts zero words for an empty note', () => {
		expect(summarizeNote('', 'empty.md').words).toBe(0)
	})
})
