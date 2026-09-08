import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EditorContext } from '@tiptap/react'
import { describe, expect, it } from 'vitest'

import { createEditor } from '@/test-utils/editor'
import { TextToolsStats } from '@/text-tools/text-tools-stats'

describe('TextToolsStats', () => {
	it('starts collapsed, with the counts hidden until expanded', () => {
		const editor = createEditor('<p>One two three four.</p>', {
			parseOnly: true,
		})

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
		const editor = createEditor('<p>One two three four.</p><p>Five six.</p>', {
			parseOnly: true,
		})

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
		const editor = createEditor('<p>One two.</p>', { parseOnly: true })

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
		const editor = createEditor('<p></p>', { parseOnly: true })

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
