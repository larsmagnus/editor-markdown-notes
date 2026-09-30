import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { NoteIndexDialog } from '#src/components/note-index-dialog'
import type { NoteIndex, NoteIndexEntry } from '#src/shared/messages'

const NOW = new Date('2026-09-30T12:00:00Z').getTime()
const DAY = 24 * 60 * 60 * 1000

beforeEach(() => {
	vi.useFakeTimers({ now: NOW, toFake: ['Date'] })
})

afterEach(() => {
	vi.useRealTimers()
})

const roadmap: NoteIndexEntry = {
	uri: 'file:///workspace/docs/planning/roadmap.md',
	fileName: 'roadmap.md',
	directory: 'docs/planning',
	title: 'Quarterly roadmap',
	description: 'What ships this quarter',
	tags: ['planning', 'q3'],
	modified: NOW - 3 * DAY,
	size: 1_234,
	characters: 1_234,
	words: 210,
	current: false,
}

const reviewer: NoteIndexEntry = {
	uri: 'file:///workspace/.claude/agents/code-reviewer.md',
	fileName: 'code-reviewer.md',
	directory: '.claude/agents',
	title: 'code-reviewer',
	description: null,
	tags: [],
	modified: NOW - 2 * 60 * 60 * 1000,
	size: 5_600,
	characters: 5_600,
	words: 900,
	current: true,
}

const changelog: NoteIndexEntry = {
	uri: 'file:///workspace/CHANGELOG.md',
	fileName: 'CHANGELOG.md',
	directory: '',
	title: 'Changelog',
	description: null,
	tags: [],
	modified: NOW - 10 * DAY,
	size: 800,
	characters: 800,
	words: 120,
	current: false,
}

const index: NoteIndex = { entries: [roadmap, reviewer, changelog], total: 3 }

function cardTitles(): string[] {
	const grid = screen.getByRole('list', { name: 'Notes' })
	return within(grid)
		.getAllByRole('button')
		.map(
			(card) =>
				document.getElementById(card.getAttribute('aria-labelledby') ?? '')
					?.textContent ?? ''
		)
}

describe('NoteIndexDialog cards', () => {
	it('shows the title, file name, folder and details of each note', () => {
		render(
			<NoteIndexDialog
				open
				onOpenChange={() => {}}
				index={index}
				onOpenEntry={() => {}}
			/>
		)

		const card = screen.getByRole('button', { name: 'Quarterly roadmap' })

		expect(within(card).getByText('roadmap.md')).toBeTruthy()
		expect(within(card).getByText('docs/planning')).toBeTruthy()
		expect(within(card).getByText('What ships this quarter')).toBeTruthy()
		expect(within(card).getByText('planning')).toBeTruthy()
		expect(within(card).getByText('q3')).toBeTruthy()
		expect(within(card).getByText('3 days ago')).toBeTruthy()
		expect(within(card).getByText('210 words')).toBeTruthy()
		expect(within(card).getByText('1,234 characters')).toBeTruthy()
	})

	it('shows the size instead of counts for a note too large to read', () => {
		render(
			<NoteIndexDialog
				open
				onOpenChange={() => {}}
				index={{
					entries: [
						{ ...roadmap, characters: null, words: null, size: 3_500_000 },
					],
					total: 1,
				}}
				onOpenEntry={() => {}}
			/>
		)

		const card = screen.getByRole('button', { name: 'Quarterly roadmap' })

		expect(within(card).getByText('3.3 MB')).toBeTruthy()
		expect(within(card).queryByText(/characters/)).toBeNull()
	})

	it('omits the last-edited time when it is unknown', () => {
		render(
			<NoteIndexDialog
				open
				onOpenChange={() => {}}
				index={{ entries: [{ ...roadmap, modified: null }], total: 1 }}
				onOpenEntry={() => {}}
			/>
		)

		const card = screen.getByRole('button', { name: 'Quarterly roadmap' })

		expect(within(card).queryByText(/ago/)).toBeNull()
	})

	it('marks the note that is currently open', () => {
		render(
			<NoteIndexDialog
				open
				onOpenChange={() => {}}
				index={index}
				onOpenEntry={() => {}}
			/>
		)

		expect(
			screen
				.getByRole('button', { name: 'code-reviewer' })
				.getAttribute('aria-current')
		).toBe('page')
		expect(
			screen
				.getByRole('button', { name: 'Quarterly roadmap' })
				.getAttribute('aria-current')
		).toBeNull()
	})
})

describe('NoteIndexDialog agentic notes', () => {
	it('tags a note inside .claude as agentic', () => {
		render(
			<NoteIndexDialog
				open
				onOpenChange={() => {}}
				index={index}
				onOpenEntry={() => {}}
			/>
		)

		const card = screen.getByRole('button', { name: 'code-reviewer' })

		expect(within(card).getByText('agentic')).toBeTruthy()
	})

	it('does not tag an ordinary note as agentic', () => {
		render(
			<NoteIndexDialog
				open
				onOpenChange={() => {}}
				index={index}
				onOpenEntry={() => {}}
			/>
		)

		const card = screen.getByRole('button', { name: 'Quarterly roadmap' })

		expect(within(card).queryByText('agentic')).toBeNull()
	})

	it('narrows the grid to agentic notes when filtering for the tag', async () => {
		const user = userEvent.setup()
		render(
			<NoteIndexDialog
				open
				onOpenChange={() => {}}
				index={index}
				onOpenEntry={() => {}}
			/>
		)

		await user.type(
			screen.getByRole('searchbox', { name: 'Filter notes' }),
			'agentic'
		)

		expect(cardTitles()).toEqual(['code-reviewer'])
	})
})

describe('NoteIndexDialog opening a note', () => {
	it('opens the clicked note in place', async () => {
		const user = userEvent.setup()
		const onOpenEntry = vi.fn()
		render(
			<NoteIndexDialog
				open
				onOpenChange={() => {}}
				index={index}
				onOpenEntry={onOpenEntry}
			/>
		)

		await user.click(screen.getByRole('button', { name: 'Quarterly roadmap' }))

		expect(onOpenEntry).toHaveBeenCalledWith(roadmap, { beside: false })
	})

	it('opens the note beside with Cmd held', async () => {
		const user = userEvent.setup()
		const onOpenEntry = vi.fn()
		render(
			<NoteIndexDialog
				open
				onOpenChange={() => {}}
				index={index}
				onOpenEntry={onOpenEntry}
			/>
		)

		await user.keyboard('{Meta>}')
		await user.click(screen.getByRole('button', { name: 'Quarterly roadmap' }))
		await user.keyboard('{/Meta}')

		expect(onOpenEntry).toHaveBeenCalledWith(roadmap, { beside: true })
	})

	it('opens the note beside with Ctrl held', async () => {
		const user = userEvent.setup()
		const onOpenEntry = vi.fn()
		render(
			<NoteIndexDialog
				open
				onOpenChange={() => {}}
				index={index}
				onOpenEntry={onOpenEntry}
			/>
		)

		await user.keyboard('{Control>}')
		await user.click(screen.getByRole('button', { name: 'Quarterly roadmap' }))
		await user.keyboard('{/Control}')

		expect(onOpenEntry).toHaveBeenCalledWith(roadmap, { beside: true })
	})
})

describe('NoteIndexDialog filtering and sorting', () => {
	it('lists the most recently edited note first', () => {
		render(
			<NoteIndexDialog
				open
				onOpenChange={() => {}}
				index={index}
				onOpenEntry={() => {}}
			/>
		)

		expect(cardTitles()).toEqual([
			'code-reviewer',
			'Quarterly roadmap',
			'Changelog',
		])
	})

	it('sorts by title', async () => {
		const user = userEvent.setup()
		render(
			<NoteIndexDialog
				open
				onOpenChange={() => {}}
				index={index}
				onOpenEntry={() => {}}
			/>
		)

		await user.click(screen.getByRole('button', { name: 'Sort by title' }))

		expect(
			screen
				.getByRole('button', { name: 'Sort by title' })
				.getAttribute('aria-pressed')
		).toBe('true')

		expect(cardTitles()).toEqual([
			'Changelog',
			'code-reviewer',
			'Quarterly roadmap',
		])
	})

	it('sorts by path', async () => {
		const user = userEvent.setup()
		render(
			<NoteIndexDialog
				open
				onOpenChange={() => {}}
				index={index}
				onOpenEntry={() => {}}
			/>
		)

		await user.click(screen.getByRole('button', { name: 'Sort by path' }))

		expect(cardTitles()).toEqual([
			'code-reviewer',
			'Changelog',
			'Quarterly roadmap',
		])
	})

	it('narrows the grid to notes matching the filter', async () => {
		const user = userEvent.setup()
		render(
			<NoteIndexDialog
				open
				onOpenChange={() => {}}
				index={index}
				onOpenEntry={() => {}}
			/>
		)

		await user.type(
			screen.getByRole('searchbox', { name: 'Filter notes' }),
			'q3'
		)

		expect(cardTitles()).toEqual(['Quarterly roadmap'])
	})

	it('says so when nothing matches the filter', async () => {
		const user = userEvent.setup()
		render(
			<NoteIndexDialog
				open
				onOpenChange={() => {}}
				index={index}
				onOpenEntry={() => {}}
			/>
		)

		await user.type(
			screen.getByRole('searchbox', { name: 'Filter notes' }),
			'kubernetes'
		)

		expect(screen.getByText('No notes match “kubernetes”')).toBeTruthy()
	})

	it('focuses the filter when it opens', async () => {
		render(
			<NoteIndexDialog
				open
				onOpenChange={() => {}}
				index={index}
				onOpenEntry={() => {}}
			/>
		)

		await waitFor(() =>
			expect(document.activeElement).toBe(
				screen.getByRole('searchbox', { name: 'Filter notes' })
			)
		)
	})
})

describe('NoteIndexDialog states', () => {
	it('shows a loading state before the index arrives', () => {
		render(
			<NoteIndexDialog
				open
				onOpenChange={() => {}}
				index={null}
				onOpenEntry={() => {}}
			/>
		)

		expect(screen.getByText('Finding notes…')).toBeTruthy()
	})

	it('says how many notes were left out when the index is capped', () => {
		render(
			<NoteIndexDialog
				open
				onOpenChange={() => {}}
				index={{ entries: [roadmap, reviewer], total: 2_345 }}
				onOpenEntry={() => {}}
			/>
		)

		expect(
			screen.getByText('Showing the 2 most recently edited of 2,345 notes')
		).toBeTruthy()
	})

	it('says so when the workspace has no notes', () => {
		render(
			<NoteIndexDialog
				open
				onOpenChange={() => {}}
				index={{ entries: [], total: 0 }}
				onOpenEntry={() => {}}
			/>
		)

		expect(screen.getByText('No notes in this workspace')).toBeTruthy()
	})
})
