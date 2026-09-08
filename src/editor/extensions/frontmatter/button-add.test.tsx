import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { ButtonAdd } from '#src/editor/extensions/frontmatter/button-add'
import { createEditor } from '#src/test-utils/editor'

describe('ButtonAdd', () => {
	it('renders when the document has no frontmatter block', () => {
		const editor = createEditor('# Roadmap', { parseOnly: true })

		render(<ButtonAdd editor={editor} />)

		expect(
			screen.getByRole('button', { name: 'Add frontmatter' })
		).toBeInTheDocument()
	})

	it('does not render once the document already has a frontmatter block', () => {
		const editor = createEditor('# Roadmap', { parseOnly: true })
		editor.commands.insertContentAt(0, { type: 'frontmatter' })

		render(<ButtonAdd editor={editor} />)

		expect(
			screen.queryByRole('button', { name: 'Add frontmatter' })
		).not.toBeInTheDocument()
	})

	it('inserts a fenced, empty frontmatter node at the top of the document when clicked', async () => {
		const editor = createEditor('# Roadmap', { parseOnly: true })

		render(<ButtonAdd editor={editor} />)
		await userEvent.click(
			screen.getByRole('button', { name: 'Add frontmatter' })
		)

		expect(editor.state.doc.firstChild?.type.name).toBe('frontmatter')
		expect(editor.state.doc.firstChild?.textContent).toBe('---\n\n---')
		// The caret lands on the blank line between the fences, ready to type.
		expect(editor.state.selection.from).toBe(5)
	})
})
