import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { SettingsProvider } from '@/components/settings-provider'
import Editor from '@/editor/editor'
import type { Analysis, TextIssue } from '@/lib/text-tools/types'
import { DEFAULT_VIEW_OPTIONS } from '@/shared/messages'

// Resolves rather than returning `undefined`: the real `updateNotes` is `async`
// and the save effect attaches a rejection handler to what it hands back.
vi.mock('@/lib/update-notes', () => ({ updateNotes: vi.fn(async () => {}) }))
vi.mock('@/editor/menu-bubble', () => ({ MenuBubble: () => null }))

/**
 * The real client boots an inline blob worker, which happy-dom cannot run. The
 * analysis itself is covered against the real retext stack in
 * `src/lib/text-tools/run-pipeline.test.ts`; what matters here is what the
 * editor does with the result.
 */
const analyze = vi.hoisted(() => vi.fn())

vi.mock('@/lib/text-tools/analyze-client', () => ({
	createAnalyzer: () => ({ analyze, dispose: vi.fn() }),
}))

const STORAGE_KEY = 'editor-markdown-notes:view-options'

const NOTE = 'The report was written by the committee.'

/** Offsets into `NOTE`, as the worker would report them. */
const PASSIVE_ISSUE: TextIssue = {
	ruleId: 'passive',
	severity: 'warning',
	message: 'Unexpected use of the passive voice',
	actual: 'written',
	expected: [],
	start: NOTE.indexOf('written'),
	end: NOTE.indexOf('written') + 'written'.length,
}

const SIMPLIFY_ISSUE: TextIssue = {
	ruleId: 'simplify',
	severity: 'warning',
	message: 'Unexpected `committee`, use `group` instead',
	actual: 'committee',
	expected: ['group'],
	start: NOTE.indexOf('committee'),
	end: NOTE.indexOf('committee') + 'committee'.length,
}

const READABILITY_ISSUE: TextIssue = {
	ruleId: 'readability',
	severity: 'very-hard',
	message: 'Unexpected hard to read sentence',
	actual: NOTE,
	expected: [],
	start: 0,
	end: NOTE.length,
}

function analysisOf(issues: TextIssue[], sentenceCount = 1): Analysis {
	return { issues, sentenceCount }
}

function renderWithTextTools(open = true) {
	localStorage.setItem(
		STORAGE_KEY,
		JSON.stringify({ ...DEFAULT_VIEW_OPTIONS, textTools: open })
	)

	return render(
		<SettingsProvider>
			<Editor content={NOTE} />
		</SettingsProvider>
	)
}

beforeEach(() => {
	analyze.mockResolvedValue(analysisOf([PASSIVE_ISSUE, SIMPLIFY_ISSUE]))
})

afterEach(() => {
	localStorage.clear()
	vi.clearAllMocks()
})

describe('text tools', () => {
	it('stays out of the way until it is switched on', async () => {
		renderWithTextTools(false)

		await screen.findByText(/report/)

		expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
		expect(analyze).not.toHaveBeenCalled()
	})

	it('lists what it found, grouped by rule', async () => {
		renderWithTextTools()

		const panel = await screen.findByRole('complementary', {
			name: 'Text tools',
		})

		expect(await within(panel).findByText('written')).toBeInTheDocument()
		expect(within(panel).getByText('committee')).toBeInTheDocument()
		expect(within(panel).getByText(/Passive voice \(1\)/)).toBeInTheDocument()
		expect(within(panel).getByText(/Simpler words \(1\)/)).toBeInTheDocument()
	})

	it('shows the suggested replacement alongside the flagged word', async () => {
		renderWithTextTools()

		const panel = await screen.findByRole('complementary', {
			name: 'Text tools',
		})

		expect(await within(panel).findByText(/→\s*group/)).toBeInTheDocument()
	})

	it('underlines the flagged words in the document', async () => {
		const { container } = renderWithTextTools()

		await waitFor(() => {
			const decorated = container.querySelectorAll('.text-tools-issue')
			expect(decorated).toHaveLength(2)
		})

		const [first] = container.querySelectorAll('.text-tools-issue')
		expect(first).toHaveTextContent('written')
		expect(first).toHaveAttribute(
			'title',
			'Unexpected use of the passive voice'
		)
	})

	it('marks a very hard sentence differently from a word-level warning', async () => {
		analyze.mockResolvedValue(analysisOf([READABILITY_ISSUE]))
		const { container } = renderWithTextTools()

		await waitFor(() => {
			expect(
				container.querySelector('.text-tools-issue--very-hard')
			).toBeInTheDocument()
		})
	})

	it('reports the readability count as a fraction of the document', async () => {
		analyze.mockResolvedValue(analysisOf([READABILITY_ISSUE], 4))
		renderWithTextTools()

		expect(
			await screen.findByText('1 of 4 sentences are very hard to read')
		).toBeInTheDocument()
	})

	it('selects the flagged text when its entry is clicked', async () => {
		const user = userEvent.setup()
		renderWithTextTools()

		const entry = await screen.findByRole('button', { name: /written/ })
		await user.click(entry)

		await waitFor(() => {
			const selected = window.getSelection()?.toString()
			expect(selected).toBe('written')
		})
	})

	it('drops a rule from the document and the list when it is unchecked', async () => {
		const user = userEvent.setup()
		const { container } = renderWithTextTools()

		const panel = await screen.findByRole('complementary', {
			name: 'Text tools',
		})
		// Scoped to the panel: the decorated word appears in the document too.
		expect(await within(panel).findByText('written')).toBeInTheDocument()

		await user.click(
			within(panel).getByRole('checkbox', { name: 'Passive voice' })
		)

		await waitFor(() => {
			expect(within(panel).queryByText('written')).not.toBeInTheDocument()
		})

		await waitFor(() => {
			expect(container.querySelectorAll('.text-tools-issue')).toHaveLength(1)
		})
	})

	it('says so when it finds nothing', async () => {
		analyze.mockResolvedValue(analysisOf([]))
		renderWithTextTools()

		expect(await screen.findByText('Nothing to flag.')).toBeInTheDocument()
	})

	// A failed analysis used to leave the panel on "Checking…" for good, because
	// the worker threw without replying and the promise never settled.
	it('stops checking when the analysis fails', async () => {
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
		analyze.mockRejectedValue(new Error('worker exploded'))

		renderWithTextTools()

		await waitFor(() => {
			expect(screen.queryByText('Checking…')).not.toBeInTheDocument()
		})

		expect(consoleError).toHaveBeenCalledWith(
			'Text tools analysis failed:',
			expect.objectContaining({ message: 'worker exploded' })
		)

		consoleError.mockRestore()
	})
})
