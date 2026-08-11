import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EditorContext } from '@tiptap/react'
import { Editor } from '@tiptap/react'
import { afterEach, describe, expect, it } from 'vitest'

import { extensions } from '@/editor/extensions'
import { TableControls } from '@/editor/table/controls'

const TABLE = [
	'| Quarter | Revenue | Growth |',
	'| --- | --- | --- |',
	'| Q1 2025 | 1.2M | 8% |',
	'| Q2 2025 | 1.4M | 17% |',
].join('\n')

let editor: Editor | null = null
let mount: HTMLDivElement | null = null

/**
 * A mounted editor with the caret in one cell of its table, numbered in reading
 * order - 0 is the first header cell, 3 the first body cell.
 *
 * Mounted into the document because the handles measure the cell elements, and
 * a detached editor has none.
 */
function renderWithCaretIn(cell: number | null) {
	mount = document.body.appendChild(document.createElement('div'))
	editor = new Editor({ element: mount, extensions, content: '' })
	editor.commands.setContent(TABLE)

	const cells = editor.view.dom.querySelectorAll('th, td')
	const position =
		cell === null
			? editor.state.doc.content.size - 1
			: editor.view.posAtDOM(cells[cell], 0)
	editor.commands.setTextSelection(position)

	return render(
		<EditorContext.Provider value={{ editor }}>
			<TableControls />
		</EditorContext.Provider>
	)
}

/** What the note would be saved as right now. */
function saved(): string {
	return String(editor?.storage.markdown.getMarkdown()).trimEnd()
}

// Only the editor's own mount point goes, not all of `document.body`: a test
// that ends with the menu still open leaves a portal there for Testing
// Library's own teardown to unmount, and that runs after this one.
afterEach(() => {
	editor?.destroy()
	editor = null
	mount?.remove()
	mount = null
})

describe('TableControls', () => {
	it('shows a handle for the row and the column the caret is in', async () => {
		renderWithCaretIn(4)

		expect(await screen.findByLabelText('Row actions')).toBeInTheDocument()
		expect(screen.getByLabelText('Column actions')).toBeInTheDocument()
	})

	it('shows no handles when the caret is outside a table', () => {
		renderWithCaretIn(null)

		expect(screen.queryByLabelText('Row actions')).not.toBeInTheDocument()
		expect(screen.queryByLabelText('Column actions')).not.toBeInTheDocument()
	})

	it('adds a column after the one the caret is in', async () => {
		renderWithCaretIn(0)

		await userEvent.click(await screen.findByLabelText('Column actions'))
		await userEvent.click(await screen.findByText('Add column after'))

		expect(saved()).toContain('| Quarter |  | Revenue | Growth |')
	})

	it('adds a row above the one the caret is in', async () => {
		renderWithCaretIn(3)

		await userEvent.click(await screen.findByLabelText('Row actions'))
		await userEvent.click(await screen.findByText('Add row above'))

		expect(saved()).toContain('| --- | --- | --- |\n|  |  |  |\n| Q1 2025 |')
	})

	// `prosemirror-tables` builds the new row from plain cells and leaves the
	// header at row 1, which `isGfmTable` rejects - the note used to save as an
	// HTML blob from here on. The new row takes the header's place instead.
	it('keeps the table markdown when adding a row above the header', async () => {
		renderWithCaretIn(0)

		await userEvent.click(await screen.findByLabelText('Row actions'))
		await userEvent.click(await screen.findByText('Add row above'))

		expect(saved()).not.toContain('<table')
		expect(saved()).toContain(
			[
				'|  |  |  |',
				'| --- | --- | --- |',
				'| Quarter | Revenue | Growth |',
			].join('\n')
		)
	})

	it('deletes the row the caret is in', async () => {
		renderWithCaretIn(3)

		await userEvent.click(await screen.findByLabelText('Row actions'))
		await userEvent.click(await screen.findByText('Delete row'))

		expect(saved()).not.toContain('Q1 2025')
		expect(saved()).toContain('Q2 2025')
	})

	it('aligns the whole column, not just the cell the caret is in', async () => {
		renderWithCaretIn(4)

		await userEvent.click(await screen.findByLabelText('Column actions'))
		await userEvent.click(await screen.findByText('Align center'))

		expect(saved()).toContain('| --- | :---: | --- |')
	})

	// Reordering is a drag gesture, which leaves it out of reach of a keyboard
	// entirely. The same two commands are in the menu.
	it('moves the row down past the one below it', async () => {
		renderWithCaretIn(3)

		await userEvent.click(await screen.findByLabelText('Row actions'))
		await userEvent.click(await screen.findByText('Move row down'))

		expect(saved()).toContain(
			'| Q2 2025 | 1.4M | 17% |\n| Q1 2025 | 1.2M | 8% |'
		)
	})

	it('moves the row up past the one above it', async () => {
		renderWithCaretIn(6)

		await userEvent.click(await screen.findByLabelText('Row actions'))
		await userEvent.click(await screen.findByText('Move row up'))

		expect(saved()).toContain(
			'| Q2 2025 | 1.4M | 17% |\n| Q1 2025 | 1.2M | 8% |'
		)
	})

	it('moves the column right past the one beside it', async () => {
		renderWithCaretIn(4)

		await userEvent.click(await screen.findByLabelText('Column actions'))
		await userEvent.click(await screen.findByText('Move column right'))

		expect(saved()).toContain('| Quarter | Growth | Revenue |')
	})

	it('moves the column left past the one beside it', async () => {
		renderWithCaretIn(4)

		await userEvent.click(await screen.findByLabelText('Column actions'))
		await userEvent.click(await screen.findByText('Move column left'))

		expect(saved()).toContain('| Revenue | Quarter | Growth |')
	})

	it('offers no move up from the first row', async () => {
		renderWithCaretIn(0)

		await userEvent.click(await screen.findByLabelText('Row actions'))

		expect(await screen.findByText('Move row up')).toHaveAttribute(
			'data-disabled'
		)
		expect(screen.getByText('Move row down')).not.toHaveAttribute(
			'data-disabled'
		)
	})

	it('offers no move right from the last column', async () => {
		renderWithCaretIn(2)

		await userEvent.click(await screen.findByLabelText('Column actions'))

		expect(await screen.findByText('Move column right')).toHaveAttribute(
			'data-disabled'
		)
		expect(screen.getByText('Move column left')).not.toHaveAttribute(
			'data-disabled'
		)
	})
})
