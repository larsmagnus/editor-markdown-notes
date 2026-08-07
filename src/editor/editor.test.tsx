import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import Editor from '@/editor/editor'

// Mermaid draws by measuring text, which happy-dom has no layout engine for.
// Stubbing the library keeps these tests about what the editor does with a
// diagram - show it, hide the source, report a parse failure - rather than
// about mermaid's own output.
const mermaid = vi.hoisted(() => ({
	initialize: vi.fn(),
	render: vi.fn(),
}))

vi.mock('mermaid', () => ({ default: mermaid }))

// The bubble menu positions itself with tippy, which measures the DOM and
// throws in happy-dom the moment anything moves the selection. Nothing here
// tests the menu, so it is stubbed out.
vi.mock('@/editor/menu-bubble', () => ({ MenuBubble: () => null }))

const MERMAID_NOTE = ['```mermaid', 'graph TD', '  A --> B', '```'].join('\n')

beforeEach(() => {
	mermaid.render.mockResolvedValue({ svg: '<svg data-testid="diagram"></svg>' })
})

afterEach(() => {
	delete window.imageBaseUris
	vi.clearAllMocks()
})

describe('Editor', () => {
	it('renders a markdown table as a real table', async () => {
		const content = [
			'| Quarter | Revenue | Growth |',
			'| --- | --- | --- |',
			'| Q1 2025 | 1.2M | 8% |',
			'| Q2 2025 | 1.4M | 17% |',
		].join('\n')

		render(<Editor content={content} />)

		const table = await screen.findByRole('table')
		expect(table).toBeInTheDocument()

		const headers = screen
			.getAllByRole('columnheader')
			.map((header) => header.textContent)
		expect(headers).toEqual(['Quarter', 'Revenue', 'Growth'])

		// One header row plus two body rows
		expect(screen.getAllByRole('row')).toHaveLength(3)
		expect(screen.getByRole('cell', { name: 'Q2 2025' })).toBeInTheDocument()
	})

	it('puts cell content straight into the cell, not into a paragraph', async () => {
		const content = [
			'| Quarter | Revenue |',
			'| --- | --- |',
			'| Q1 2025 | **1.2M** |',
		].join('\n')

		render(<Editor content={content} />)

		const table = await screen.findByRole('table')
		expect(table.querySelector('p')).toBeNull()
		expect(screen.getByRole('cell', { name: '1.2M' })).toContainHTML(
			'<strong>1.2M</strong>'
		)
	})

	it('renders a task list as checkboxes with their checked state', async () => {
		const content = ['- [x] Ship table support', '- [ ] Ship footnotes'].join(
			'\n'
		)

		render(<Editor content={content} />)

		const checkboxes = await screen.findAllByRole('checkbox')
		expect(checkboxes).toHaveLength(2)
		expect(checkboxes[0]).toBeChecked()
		expect(checkboxes[1]).not.toBeChecked()
	})

	// Outside VSCode the notes are served from the site root, so the author's
	// path is already the right one and must reach the DOM untouched.
	it('renders an image with its alt text', async () => {
		const content =
			'![Editor Markdown Notes icon](./icon-editor-markdown-notes.png)'

		render(<Editor content={content} />)

		const image = await screen.findByRole('img', {
			name: 'Editor Markdown Notes icon',
		})
		expect(image).toHaveAttribute('src', './icon-editor-markdown-notes.png')
	})

	it('points images at a vscode-resource URI without rewriting the markdown', async () => {
		window.imageBaseUris = {
			document:
				'https://file+.vscode-resource.vscode-cdn.net/Users/dev/notes/docs',
			workspace: 'https://file+.vscode-resource.vscode-cdn.net/Users/dev/notes',
		}

		render(<Editor content="![Architecture](./diagram.png)" />)

		const image = await screen.findByRole('img', { name: 'Architecture' })
		expect(image).toHaveAttribute(
			'src',
			'https://file+.vscode-resource.vscode-cdn.net/Users/dev/notes/docs/diagram.png'
		)
	})

	it('renders a mermaid block as a diagram, not as source', async () => {
		render(<Editor content={MERMAID_NOTE} />)

		// Queried fresh rather than held onto: loading the content remounts the
		// node view, so an earlier reference is detached by the time it is read.
		await waitFor(() => {
			const diagram = screen.getByRole('button', { name: /diagram/i })
			expect(diagram.querySelector('svg')).toBeInTheDocument()
		})

		expect(mermaid.render).toHaveBeenCalledWith(
			expect.any(String),
			'graph TD\n  A --> B'
		)
	})

	// Mermaid arrives over a dynamic import, so there is always a moment before
	// the first diagram exists - and if that import fails there is no diagram at
	// all. Either way the block must not read as empty.
	it('shows the source until the diagram has rendered', async () => {
		mermaid.render.mockReturnValue(new Promise(() => {}))

		render(<Editor content={MERMAID_NOTE} />)

		expect(await screen.findByText(/graph TD/)).toBeInTheDocument()
	})

	// The node view remounts whenever the content is reloaded, and a remount
	// starts out previewing - so it must not happen while the source is being
	// edited, or the block would collapse mid-keystroke.
	it('keeps the source open while it is being edited', async () => {
		render(<Editor content={MERMAID_NOTE} />)

		await userEvent.click(
			await screen.findByRole('button', { name: /diagram/i })
		)
		await userEvent.keyboard('  C --> D')

		expect(
			screen.queryByRole('button', { name: /diagram/i })
		).not.toBeInTheDocument()
		expect(screen.getByText(/C --> D/)).toBeInTheDocument()
	})

	it('swaps the diagram for its source when clicked', async () => {
		render(<Editor content={MERMAID_NOTE} />)

		const diagram = await screen.findByRole('button', { name: /diagram/i })
		await userEvent.click(diagram)

		expect(
			screen.queryByRole('button', { name: /diagram/i })
		).not.toBeInTheDocument()
		expect(screen.getByText(/graph TD/)).toBeInTheDocument()
	})

	// The source lives in the editor's one contenteditable element, so moving the
	// caret to another paragraph blurs nothing - only the editor's own selection
	// says the block was left.
	it('renders the diagram again once the caret leaves the block', async () => {
		render(<Editor content={`${MERMAID_NOTE}\n\nA paragraph below.`} />)

		await userEvent.click(
			await screen.findByRole('button', { name: /diagram/i })
		)
		expect(
			screen.queryByRole('button', { name: /diagram/i })
		).not.toBeInTheDocument()

		await userEvent.click(screen.getByText('A paragraph below.'))

		expect(
			await screen.findByRole('button', { name: /diagram/i })
		).toBeInTheDocument()
	})

	// A diagram that will not parse renders nothing, so without the message the
	// block looks identical to an empty one and there is no way to fix it.
	it('reports the parse error when a mermaid block is invalid', async () => {
		mermaid.render.mockRejectedValue(new Error('Parse error on line 1'))

		render(<Editor content={['```mermaid', 'graph ??', '```'].join('\n')} />)

		expect(await screen.findByRole('alert')).toHaveTextContent(
			'Parse error on line 1'
		)
		expect(screen.getByText(/graph \?\?/)).toBeInTheDocument()
	})

	it('renders a link for a bare URL', async () => {
		render(<Editor content="Docs live at https://example.com today." />)

		const link = await screen.findByRole('link', {
			name: 'https://example.com',
		})
		expect(link).toHaveAttribute('href', 'https://example.com')
	})
})
