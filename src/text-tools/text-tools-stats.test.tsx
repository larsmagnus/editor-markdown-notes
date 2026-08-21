import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Editor, EditorContext } from '@tiptap/react'
import { afterEach, describe, expect, it } from 'vitest'

import { extensions } from '@/editor/extensions/extensions'
import { TextToolsStats } from '@/text-tools/text-tools-stats'

let currentEditor: Editor | undefined

afterEach(() => {
	currentEditor?.destroy()
	currentEditor = undefined
})

describe('TextToolsStats', () => {
	it('starts collapsed, with the counts hidden until expanded', () => {
		const editor = new Editor({
			extensions,
			content: '<p>One two three four.</p>',
		})
		currentEditor = editor

		render(
			<EditorContext.Provider value={{ editor }}>
				<TextToolsStats sentenceCount={1} />
			</EditorContext.Provider>
		)

		expect(screen.getByText('Document stats')).toBeInTheDocument()
		expect(screen.queryByText('Words')).not.toBeInTheDocument()
	})

	it('shows word, character, sentence and paragraph counts once expanded', async () => {
		const user = userEvent.setup()
		const editor = new Editor({
			extensions,
			content: '<p>One two three four.</p><p>Five six.</p>',
		})
		currentEditor = editor

		render(
			<EditorContext.Provider value={{ editor }}>
				<TextToolsStats sentenceCount={2} />
			</EditorContext.Provider>
		)

		await user.click(screen.getByText('Document stats'))

		const dl = screen.getByText('Words').closest('dl')
		expect(dl).not.toBeNull()
		expect(dl).toHaveTextContent('Words6')
		// 28, not 30 - the synthetic separator `getText()` inserts between the
		// two paragraphs was never actually typed and must not count.
		expect(dl).toHaveTextContent('Characters28')
		expect(dl).toHaveTextContent('Sentences2')
		expect(dl).toHaveTextContent('Paragraphs2')
		expect(dl).toHaveTextContent('Avg. words/sentence3')
	})

	it('updates counts after the document changes', async () => {
		const user = userEvent.setup()
		const editor = new Editor({ extensions, content: '<p>One two.</p>' })
		currentEditor = editor

		render(
			<EditorContext.Provider value={{ editor }}>
				<TextToolsStats sentenceCount={1} />
			</EditorContext.Provider>
		)

		await user.click(screen.getByText('Document stats'))
		expect(screen.getByText('Words').closest('dl')).toHaveTextContent('Words2')

		act(() => {
			editor.commands.setContent('<p>One two three.</p>')
		})

		expect(screen.getByText('Words').closest('dl')).toHaveTextContent('Words3')
	})

	it('shows a placeholder for the sentence average when there are no sentences', async () => {
		const user = userEvent.setup()
		const editor = new Editor({ extensions, content: '<p></p>' })
		currentEditor = editor

		render(
			<EditorContext.Provider value={{ editor }}>
				<TextToolsStats sentenceCount={0} />
			</EditorContext.Provider>
		)

		await user.click(screen.getByText('Document stats'))

		expect(
			screen.getByText('Avg. words/sentence').closest('dl')
		).toHaveTextContent('Avg. words/sentence—')
	})
})
