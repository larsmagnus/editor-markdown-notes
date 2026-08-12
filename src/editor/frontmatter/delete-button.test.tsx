import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Editor } from '@tiptap/react'
import { afterEach, describe, expect, it } from 'vitest'

import { extensions } from '@/editor/extensions'
import { FrontmatterDeleteButton } from '@/editor/frontmatter/delete-button'

const editors: Editor[] = []

afterEach(() => {
	editors.forEach((editor) => editor.destroy())
	editors.length = 0
})

describe('FrontmatterDeleteButton', () => {
	it('removes the frontmatter node when clicked', async () => {
		const editor = new Editor({ extensions, content: '' })
		editors.push(editor)
		editor.commands.insertContentAt(0, {
			type: 'frontmatter',
			content: [{ type: 'text', text: 'title: Roadmap' }],
		})

		render(<FrontmatterDeleteButton editor={editor} getPos={() => 0} />)
		await userEvent.click(screen.getByLabelText('Delete frontmatter'))

		expect(editor.state.doc.firstChild?.type.name).not.toBe('frontmatter')
	})

	// A real Ctrl+Z round trip through actual, separately-timed keystrokes is
	// covered at the integration level (`editor.test.tsx`). Scripting the setup
	// and the click back-to-back here, with no real time between them, would
	// have `prosemirror-history`'s own grouping heuristic merge both into one
	// step regardless of anything this button does - so what's worth asserting
	// here is the one thing the button actually controls: its delete doesn't
	// opt out of history.
	it('deletes with a transaction eligible for undo', async () => {
		const editor = new Editor({ extensions, content: '' })
		editors.push(editor)
		editor.commands.insertContentAt(0, {
			type: 'frontmatter',
			content: [{ type: 'text', text: 'title: Roadmap' }],
		})

		let historyEligible = false
		editor.on('transaction', ({ transaction }) => {
			historyEligible = transaction.getMeta('addToHistory') !== false
		})

		render(<FrontmatterDeleteButton editor={editor} getPos={() => 0} />)
		await userEvent.click(screen.getByLabelText('Delete frontmatter'))

		expect(historyEligible).toBe(true)
	})
})
