import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import Editor from '@/editor/editor'
import { copyToClipboard } from '@/lib/clipboard'
import { updateNotes } from '@/lib/update-notes'

// Resolves rather than returning `undefined`: the real `updateNotes` is `async`
// and the save effect attaches a rejection handler to what it hands back.
vi.mock('@/lib/update-notes', () => ({ updateNotes: vi.fn(async () => {}) }))

// Mermaid draws by measuring text, which happy-dom has no layout engine for.
// Stubbing it keeps these tests about what the editor does with a diagram -
// show it, hide the source, report a parse failure - rather than about
// mermaid's own output. Stubbed at this boundary rather than the `mermaid`
// package itself: `renderMermaid` reaches it through a dynamic `import()`,
// and two blocks mounting together call that concurrently - mocking a
// dynamically-imported module does not reliably survive being raced like
// that, so one block would intermittently get the real, un-mocked mermaid
// instead of the stub.
const renderMermaid = vi.hoisted(() => vi.fn())
vi.mock('@/lib/render-mermaid', () => ({ renderMermaid }))

// The bubble menu positions itself with floating-ui, which measures the DOM
// and throws in happy-dom the moment anything moves the selection. Nothing
// here tests the menu, so it is stubbed out.
vi.mock('@/editor/menu-bubble', () => ({ MenuBubble: () => null }))

// The app's one seam onto the clipboard, mocked here so no test has to replace
// `navigator` - a stub built from `{ ...navigator, clipboard }` drops the
// prototype getters ProseMirror reads when it constructs an editor.
vi.mock('@/lib/clipboard', () => ({ copyToClipboard: vi.fn() }))

const MERMAID_NOTE = ['```mermaid', 'graph TD', '  A --> B', '```'].join('\n')

beforeEach(() => {
	renderMermaid.mockResolvedValue({
		svg: '<svg data-testid="diagram"></svg>',
	})
})

afterEach(() => {
	delete window.imageBaseUris
	vi.clearAllMocks()
	vi.unstubAllGlobals()
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

	it('renders a column the markdown aligns, header and body alike', async () => {
		const content = [
			'| Quarter | Revenue |',
			'| --- | ---: |',
			'| Q1 2025 | 1.2M |',
		].join('\n')

		render(<Editor content={content} />)

		const revenue = await screen.findByRole('columnheader', { name: 'Revenue' })
		expect(revenue).toHaveStyle({ textAlign: 'right' })
		expect(screen.getByRole('cell', { name: '1.2M' })).toHaveStyle({
			textAlign: 'right',
		})
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
			const diagram = screen.getByRole('img', { name: /diagram/i })
			expect(diagram.querySelector('svg')).toBeInTheDocument()
		})

		expect(renderMermaid).toHaveBeenCalledWith(
			'graph TD\n  A --> B',
			expect.any(Boolean)
		)
	})

	// Mermaid arrives over a dynamic import, so there is always a moment before
	// the first diagram exists - and if that import fails there is no diagram at
	// all. Either way the block must not read as empty.
	it('shows the source until the diagram has rendered', async () => {
		renderMermaid.mockReturnValue(new Promise(() => {}))

		render(<Editor content={MERMAID_NOTE} />)

		expect(await screen.findByText(/graph TD/)).toBeInTheDocument()
	})

	// The node view remounts whenever the content is reloaded, and a remount
	// starts out previewing - so it must not happen while the source is being
	// edited, or the block would collapse mid-keystroke.
	it('keeps the source open while it is being edited', async () => {
		render(<Editor content={MERMAID_NOTE} />)

		await screen.findByRole('img', { name: /diagram/i })
		await userEvent.click(screen.getByLabelText('Edit diagram source'))
		await userEvent.keyboard('  C --> D')

		// Awaited because `focus()` lands the caret on the next animation frame,
		// so the swap out of the diagram is always a frame behind the click.
		await waitFor(() =>
			expect(
				screen.queryByRole('img', { name: /diagram/i })
			).not.toBeInTheDocument()
		)
		expect(screen.getByText(/C --> D/)).toBeInTheDocument()
	})

	// Clicking the diagram itself pans it, so opening the source is the
	// toolbar's job - and the only way in.
	it('swaps the diagram for its source from the toolbar', async () => {
		render(<Editor content={MERMAID_NOTE} />)

		await screen.findByRole('img', { name: /diagram/i })
		await userEvent.click(screen.getByLabelText('Edit diagram source'))

		// Awaited because `focus()` lands the caret on the next animation frame,
		// so the swap out of the diagram is always a frame behind the click.
		await waitFor(() =>
			expect(
				screen.queryByRole('img', { name: /diagram/i })
			).not.toBeInTheDocument()
		)
		expect(screen.getByText(/graph TD/)).toBeInTheDocument()
	})

	// The source lives in the editor's one contenteditable element, so moving the
	// caret to another paragraph blurs nothing - only the editor's own selection
	// says the block was left.
	it('renders the diagram again once the caret leaves the block', async () => {
		render(<Editor content={`${MERMAID_NOTE}\n\nA paragraph below.`} />)

		await screen.findByRole('img', { name: /diagram/i })
		await userEvent.click(screen.getByLabelText('Edit diagram source'))
		// Awaited because `focus()` lands the caret on the next animation frame,
		// so the swap out of the diagram is always a frame behind the click.
		await waitFor(() =>
			expect(
				screen.queryByRole('img', { name: /diagram/i })
			).not.toBeInTheDocument()
		)

		await userEvent.click(screen.getByText('A paragraph below.'))

		expect(
			await screen.findByRole('img', { name: /diagram/i })
		).toBeInTheDocument()
	})

	// A diagram that will not parse renders nothing, so without the message the
	// block looks identical to an empty one and there is no way to fix it.
	it('reports the parse error when a mermaid block is invalid', async () => {
		renderMermaid.mockResolvedValue({ error: 'Parse error on line 1' })

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

	describe('slash command', () => {
		it('opens a menu and inserts a table', async () => {
			render(<Editor content={''} />)

			// Clicked into rather than typed into straight away: the editor no
			// longer autofocuses, so that a note opens where it was last scrolled
			// to. The empty paragraph and not the editable region around it -
			// happy-dom has no layout for `posAtCoords` to read, so a click landing
			// anywhere but on a textblock leaves the selection somewhere the
			// keystrokes below never reach.
			const editable = await screen.findByRole('textbox')
			await userEvent.click(editable.querySelector('p') ?? editable)

			await userEvent.keyboard('/table')

			await userEvent.click(
				await screen.findByRole('option', { name: 'Table' })
			)

			expect(await screen.findByRole('table')).toBeInTheDocument()
		})

		it('closes without inserting anything on Escape', async () => {
			render(<Editor content={''} />)

			// Clicked into for the same reason as above.
			const editable = await screen.findByRole('textbox')
			await userEvent.click(editable.querySelector('p') ?? editable)

			await userEvent.keyboard('/table')
			await screen.findByRole('option', { name: 'Table' })
			await userEvent.keyboard('{Escape}')

			expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
			expect(screen.queryByRole('table')).not.toBeInTheDocument()
		})
	})

	describe('syncing the content prop', () => {
		/**
		 * In VSCode the host echoes each autosave back as an `update`, so the
		 * editor is routinely handed markdown equivalent to what it already holds.
		 * The document has to survive that untouched.
		 */
		it('keeps the document when the host echoes back equivalent markdown', async () => {
			const { rerender } = render(<Editor content={'# Roadmap\n\nShip it.'} />)

			await screen.findByRole('heading', { name: 'Roadmap' })
			await userEvent.click(screen.getByText('Ship it.'))
			await userEvent.keyboard(' Today.')

			// What the host would write to disk and send straight back.
			rerender(<Editor content={'# Roadmap\n\nShip it. Today.'} />)

			await userEvent.keyboard(' Really.')

			expect(screen.getByText('Ship it. Today. Really.')).toBeInTheDocument()
		})

		it('adopts genuinely new content from the host', async () => {
			const { rerender } = render(<Editor content={'# Roadmap\n\nShip it.'} />)

			await screen.findByRole('heading', { name: 'Roadmap' })

			rerender(<Editor content={'# Backlog\n\nSoon.'} />)

			expect(
				await screen.findByRole('heading', { name: 'Backlog' })
			).toBeInTheDocument()
			expect(screen.getByText('Soon.')).toBeInTheDocument()
		})

		/**
		 * Replacing the document destroys any node view the new one has no room
		 * for, and ProseMirror dispatches `selectionUpdate` synchronously inside
		 * that same replacement - before React runs the destroyed view's effect
		 * cleanup. The dead listener therefore still fires, with a `getPos` that
		 * now returns `undefined`. Passing that to `doc.nodeAt` threw out of an
		 * effect and unmounted the whole app, which is what switching from
		 * `notes.md` (two diagrams) to `other-note.md` (one) used to do.
		 */
		it('survives switching to a note with fewer mermaid blocks', async () => {
			// A trailing paragraph in both, so autofocus lands the caret there rather
			// than inside the last block - a block holding the caret shows its source
			// instead of its diagram.
			const twoDiagrams = [
				MERMAID_NOTE,
				'',
				'```mermaid',
				'graph LR',
				'  C --> D',
				'```',
				'',
				'Two diagrams above.',
			].join('\n')

			const { rerender } = render(<Editor content={twoDiagrams} />)

			await waitFor(() => {
				expect(screen.getAllByRole('img', { name: /diagram/i })).toHaveLength(2)
			})

			rerender(<Editor content={`${MERMAID_NOTE}\n\nOne diagram left.`} />)

			expect(await screen.findByText('One diagram left.')).toBeInTheDocument()
			await waitFor(() => {
				expect(screen.getAllByRole('img', { name: /diagram/i })).toHaveLength(1)
			})
		})
	})

	describe('saving', () => {
		/**
		 * Emptying a note without frontmatter serializes to `''`, which the
		 * debounce used to be seeded with and guarded on truthiness - so the save
		 * looked like the "nothing has been typed yet" state and never reached
		 * disk. Deleting everything is exactly how an author clears a note to
		 * start over, and the deletion has to survive a reload.
		 */
		it('saves a note the author has emptied entirely', async () => {
			render(<Editor content={'# Roadmap\n\nShip it.'} />)

			await screen.findByRole('heading', { name: 'Roadmap' })
			await userEvent.click(screen.getByText('Ship it.'))
			await userEvent.keyboard('{Control>}a{/Control}{Backspace}')

			await waitFor(
				() => {
					expect(updateNotes).toHaveBeenCalledWith('')
				},
				{ timeout: 2000 }
			)
		})

		it('autosaves an ordinary edit once the typing pauses', async () => {
			render(<Editor content={'# Roadmap\n\nShip it.'} />)

			await screen.findByRole('heading', { name: 'Roadmap' })
			await userEvent.click(screen.getByText('Ship it.'))
			await userEvent.keyboard(' Today.')

			await waitFor(
				() => {
					expect(updateNotes).toHaveBeenCalledWith(
						'# Roadmap\n\nShip it. Today.'
					)
				},
				{ timeout: 2000 }
			)
		})
	})

	describe('frontmatter', () => {
		const FRONTMATTER_NOTE = [
			'---',
			'title: Roadmap',
			'status: draft',
			'---',
			'',
			'# Roadmap',
			'',
			'Ship it.',
		].join('\n')

		it('keeps frontmatter keys out of the document heading', async () => {
			render(<Editor content={FRONTMATTER_NOTE} />)

			expect(
				await screen.findByRole('heading', { name: 'Roadmap' })
			).toBeInTheDocument()
		})

		// Loading a note that has frontmatter inserts a node right after mount -
		// undoable like any other transaction unless it opts out, which would put
		// a phantom step ahead of the user's very first keystroke and let Ctrl+Z
		// clear a document nobody has touched yet.
		it('does not clear a freshly loaded document on Ctrl+Z', async () => {
			const { container } = render(<Editor content={FRONTMATTER_NOTE} />)

			await screen.findByRole('heading', { name: 'Roadmap' })
			const before = container.querySelector('.ProseMirror')?.textContent

			await userEvent.keyboard('{Control>}z{/Control}')
			await userEvent.keyboard('{Control>}z{/Control}')
			await userEvent.keyboard('{Control>}z{/Control}')

			expect(container.querySelector('.ProseMirror')?.textContent).toBe(before)
		})

		it('shows the frontmatter block with the raw frontmatter text', async () => {
			const { container } = render(<Editor content={FRONTMATTER_NOTE} />)

			await screen.findByRole('heading', { name: 'Roadmap' })
			const block = container.querySelector('[data-type="frontmatter"]')
			expect(block?.textContent).toContain('title: Roadmap')
			expect(block?.textContent).toContain('status: draft')
		})

		// Frontmatter is always the document's first node, so there is nowhere
		// for the caret to go above it - it should stay put rather than land
		// somewhere with nothing rendered to show for it. A single-line block
		// keeps the click-then-navigate-left setup deterministic in a layout-less
		// test DOM, where a multi-line block's per-character caret math isn't.
		it('keeps the caret inside the block when Up/Left is pressed at its start', async () => {
			const note = ['---', 'title: Roadmap', '---', '', '# Roadmap'].join('\n')
			const { container } = render(<Editor content={note} />)

			await screen.findByRole('heading', { name: 'Roadmap' })
			// Clicking the first token rather than the full line: syntax
			// highlighting may or may not have split the text into spans by the
			// time this runs, and 'title' alone is a match either way.
			await userEvent.click(screen.getByText(/^title/))
			for (let index = 0; index < 20; index += 1) {
				await userEvent.keyboard('{ArrowLeft}')
			}
			await userEvent.keyboard('{ArrowUp}')
			await userEvent.keyboard('x')

			expect(
				container.querySelector('[data-type="frontmatter"]')?.textContent
			).toBe('Frontmatterxtitle: Roadmap')
		})

		it('hides the add-frontmatter button for a note that already has one', async () => {
			render(<Editor content={FRONTMATTER_NOTE} />)

			await screen.findByRole('heading', { name: 'Roadmap' })
			expect(
				screen.queryByRole('button', { name: 'Add frontmatter' })
			).not.toBeInTheDocument()
		})

		it('shows the add-frontmatter button for a note without one', async () => {
			render(<Editor content={'# Roadmap\n\nShip it.'} />)

			await screen.findByRole('heading', { name: 'Roadmap' })
			expect(
				screen.getByRole('button', { name: 'Add frontmatter' })
			).toBeInTheDocument()
		})

		// Only the "Ship it." paragraph was deleted, so the fences and their keys
		// have to survive it - an emptied body is not an emptied file. Backspaces
		// a precise count rather than selecting with Home/End: happy-dom has no
		// `setSelectionRange` for a contentEditable region, which those keys need.
		it('saves a body the author has emptied, keeping the frontmatter', async () => {
			render(<Editor content={FRONTMATTER_NOTE} />)

			await screen.findByRole('heading', { name: 'Roadmap' })
			await userEvent.click(screen.getByText('Ship it.'))
			await userEvent.keyboard('{Backspace}'.repeat('Ship it.'.length))

			await waitFor(
				() => {
					expect(updateNotes).toHaveBeenCalledWith(
						expect.stringContaining('---\ntitle: Roadmap\nstatus: draft\n---')
					)
				},
				{ timeout: 2000 }
			)
			expect(updateNotes).toHaveBeenCalledWith(
				expect.not.stringContaining('Ship it.')
			)
		})

		it('saves edits made directly in the frontmatter block, fences preserved', async () => {
			render(<Editor content={FRONTMATTER_NOTE} />)

			await screen.findByRole('heading', { name: 'Roadmap' })
			// Syntax highlighting splits the block's text into several `<span>`s
			// ('status', ': ', 'draft') - clicking the last one lands the cursor at
			// its end, the same place a click already lands in the plain-paragraph
			// case above, so typing appends right after "draft" with no extra
			// navigation needed.
			await userEvent.click(screen.getByText('draft'))
			await userEvent.keyboard('\npriority: high')

			await waitFor(
				() => {
					expect(updateNotes).toHaveBeenCalledWith(
						expect.stringContaining(
							'---\ntitle: Roadmap\nstatus: draft\npriority: high\n---'
						)
					)
				},
				{ timeout: 2000 }
			)
		})

		it('copies the frontmatter text via its copy button', async () => {
			render(<Editor content={FRONTMATTER_NOTE} />)
			await screen.findByRole('heading', { name: 'Roadmap' })

			await userEvent.click(screen.getByLabelText('Copy frontmatter'))

			expect(copyToClipboard).toHaveBeenCalledWith(
				'title: Roadmap\nstatus: draft'
			)
		})

		it('deletes the frontmatter block, undoably', async () => {
			const { container } = render(<Editor content={FRONTMATTER_NOTE} />)

			await screen.findByRole('heading', { name: 'Roadmap' })
			// A real pause, not a scripting convenience: the load and the delete
			// need to land in separate `prosemirror-history` groups (grouped by
			// wall-clock proximity, ~500ms) for the later Ctrl+Z to undo only the
			// delete rather than the load as well.
			await new Promise((resolve) => setTimeout(resolve, 600))
			await userEvent.click(screen.getByLabelText('Delete frontmatter'))

			expect(
				container.querySelector('[data-type="frontmatter"]')
			).not.toBeInTheDocument()

			await waitFor(
				() => {
					expect(updateNotes).toHaveBeenCalledWith('# Roadmap\n\nShip it.')
				},
				{ timeout: 2000 }
			)

			await userEvent.keyboard('{Control>}z{/Control}')
			expect(
				container.querySelector('[data-type="frontmatter"]')
			).toBeInTheDocument()
		})

		it('adds an empty frontmatter block via the add button', async () => {
			const { container } = render(<Editor content={'# Roadmap\n\nShip it.'} />)

			await screen.findByRole('heading', { name: 'Roadmap' })
			await userEvent.click(
				screen.getByRole('button', { name: 'Add frontmatter' })
			)

			expect(
				container.querySelector('[data-type="frontmatter"]')
			).toBeInTheDocument()
			await userEvent.keyboard('title: Roadmap')

			await waitFor(
				() => {
					expect(updateNotes).toHaveBeenCalledWith(
						expect.stringContaining('---\ntitle: Roadmap\n---\n\n')
					)
				},
				{ timeout: 2000 }
			)
		})

		it('promotes a manually typed --- fence block into a frontmatter block', async () => {
			// Starts empty rather than navigating to the top of existing content:
			// happy-dom has no `setSelectionRange` for a contentEditable region, so
			// `{Home}` can't be used, and position 0 is the only place frontmatter
			// can be typed. The click lands there, on the empty paragraph itself -
			// with no layout for `posAtCoords` to read, a click anywhere but on a
			// textblock leaves the selection where the input rule below, which is
			// what turns `---` into a horizontal rule, never sees it.
			const { container } = render(<Editor content={''} />)
			const editable = await screen.findByRole('textbox')
			await userEvent.click(editable.querySelector('p') ?? editable)

			await userEvent.keyboard('---{Enter}title: Roadmap{Enter}---{Enter}')

			await waitFor(() => {
				expect(
					container.querySelector('[data-type="frontmatter"]')
				).toBeInTheDocument()
			})
			expect(
				container.querySelector('[data-type="frontmatter"]')?.textContent
			).toContain('title: Roadmap')
		})
	})
})
