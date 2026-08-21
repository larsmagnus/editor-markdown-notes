import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Editor } from '@tiptap/react'
import { afterEach, describe, expect, it } from 'vitest'

import { extensions } from '@/editor/extensions/extensions'
import { ButtonAdd } from '@/editor/extensions/frontmatter/button-add'

const editors: Editor[] = []

afterEach(() => {
	editors.forEach((editor) => editor.destroy())
	editors.length = 0
})

describe('ButtonAdd', () => {
	it('renders when the document has no frontmatter block', () => {
		const editor = new Editor({ extensions, content: '# Roadmap' })
		editors.push(editor)

		render(<ButtonAdd editor={editor} />)

		expect(
			screen.getByRole('button', { name: 'Add frontmatter' })
		).toBeInTheDocument()
	})

	it('does not render once the document already has a frontmatter block', () => {
		const editor = new Editor({ extensions, content: '# Roadmap' })
		editors.push(editor)
		editor.commands.insertContentAt(0, { type: 'frontmatter' })

		render(<ButtonAdd editor={editor} />)

		expect(
			screen.queryByRole('button', { name: 'Add frontmatter' })
		).not.toBeInTheDocument()
	})

	it('inserts an empty frontmatter node at the top of the document when clicked', async () => {
		const editor = new Editor({ extensions, content: '# Roadmap' })
		editors.push(editor)

		render(<ButtonAdd editor={editor} />)
		await userEvent.click(
			screen.getByRole('button', { name: 'Add frontmatter' })
		)

		expect(editor.state.doc.firstChild?.type.name).toBe('frontmatter')
		expect(editor.state.doc.firstChild?.textContent).toBe('')
	})
})
