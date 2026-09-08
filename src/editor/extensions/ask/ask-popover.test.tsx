import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EditorContext } from '@tiptap/react'
import { describe, expect, it } from 'vitest'

import { AskPopover } from '@/editor/extensions/ask/ask-popover'
import { askProposalPluginKey } from '@/editor/extensions/ask/ask-suggestion-extension'
import { createEditor } from '@/test-utils/editor'

function renderPopover(
	content: string,
	selection: { from: number; to: number }
) {
	const editor = createEditor(content, { parseOnly: true })
	editor.commands.setTextSelection(selection)

	render(
		<EditorContext.Provider value={{ editor }}>
			<AskPopover />
		</EditorContext.Provider>
	)

	return editor
}

describe('AskPopover', () => {
	it('starts a proposal with a preset prompt for the current selection', async () => {
		const user = userEvent.setup()
		const editor = renderPopover('<p>Hello world</p>', { from: 1, to: 6 })

		await user.click(screen.getByRole('button', { name: 'Ask Claude' }))
		await user.click(screen.getByRole('button', { name: 'Shorten' }))

		expect(askProposalPluginKey.getState(editor.state)).toMatchObject({
			from: 1,
			to: 6,
			prompt: 'Shorten this text while keeping its meaning.',
			status: 'streaming',
		})
	})

	it('starts a proposal with the typed free-text prompt', async () => {
		const user = userEvent.setup()
		const editor = renderPopover('<p>Hello world</p>', { from: 1, to: 6 })

		await user.click(screen.getByRole('button', { name: 'Ask Claude' }))
		await user.type(
			screen.getByPlaceholderText('Or ask something else…'),
			'Translate to French'
		)
		await user.click(screen.getByRole('button', { name: 'Ask' }))

		expect(askProposalPluginKey.getState(editor.state)).toMatchObject({
			prompt: 'Translate to French',
			status: 'streaming',
		})
	})

	it('ignores an empty free-text submission', async () => {
		const user = userEvent.setup()
		const editor = renderPopover('<p>Hello world</p>', { from: 1, to: 6 })

		await user.click(screen.getByRole('button', { name: 'Ask Claude' }))
		await user.click(screen.getByRole('button', { name: 'Ask' }))

		expect(askProposalPluginKey.getState(editor.state)).toBeNull()
	})
})
