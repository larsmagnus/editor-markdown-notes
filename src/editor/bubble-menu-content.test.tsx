import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Editor, EditorContext } from '@tiptap/react'
import { describe, expect, it } from 'vitest'

import { BubbleMenuContent } from '@/editor/bubble-menu-content'
import { extensions } from '@/editor/extensions'

/**
 * These render `BubbleMenuContent` directly rather than `MenuBubble`. The bubble
 * positions itself through floating-ui, which measures the DOM, and happy-dom
 * cannot - it renders nothing and then throws on teardown.
 *
 * Colours are asserted through `editor.isActive` rather than `getHTML()`:
 * Tailwind v4 ships `oklch(...)` values and happy-dom's CSS parser drops them
 * from the serialized style attribute.
 */

describe('headings', () => {
	it('turns the selected paragraph into a heading', async () => {
		const editor = new Editor({ extensions, content: 'Some notes' })
		editor.commands.setTextSelection({ from: 6, to: 11 })
		render(
			<EditorContext.Provider value={{ editor }}>
				<BubbleMenuContent />
			</EditorContext.Provider>
		)

		await userEvent.click(screen.getByTitle('Heading'))
		await userEvent.click(screen.getByTitle('Heading 2'))

		expect(editor.getHTML()).toContain('<h2>Some notes</h2>')
	})
})

describe('text styles', () => {
	it('bolds the selection', async () => {
		const editor = new Editor({ extensions, content: 'Some notes' })
		editor.commands.setTextSelection({ from: 6, to: 11 })
		render(
			<EditorContext.Provider value={{ editor }}>
				<BubbleMenuContent />
			</EditorContext.Provider>
		)

		await userEvent.click(screen.getByTitle('bold'))

		expect(editor.getHTML()).toContain('<strong>notes</strong>')
	})

	it('italicises the selection', async () => {
		const editor = new Editor({ extensions, content: 'Some notes' })
		editor.commands.setTextSelection({ from: 6, to: 11 })
		render(
			<EditorContext.Provider value={{ editor }}>
				<BubbleMenuContent />
			</EditorContext.Provider>
		)

		await userEvent.click(screen.getByTitle('italic'))

		expect(editor.getHTML()).toContain('<em>notes</em>')
	})

	it('strikes through the selection', async () => {
		const editor = new Editor({ extensions, content: 'Some notes' })
		editor.commands.setTextSelection({ from: 6, to: 11 })
		render(
			<EditorContext.Provider value={{ editor }}>
				<BubbleMenuContent />
			</EditorContext.Provider>
		)

		await userEvent.click(screen.getByTitle('strike'))

		expect(editor.getHTML()).toContain('<s>notes</s>')
	})
})

describe('links', () => {
	it('applies the typed URL to the selection', async () => {
		const editor = new Editor({ extensions, content: 'Read the notes' })
		editor.commands.setTextSelection({ from: 10, to: 15 })
		render(
			<EditorContext.Provider value={{ editor }}>
				<BubbleMenuContent />
			</EditorContext.Provider>
		)

		await userEvent.click(screen.getByTitle('Link'))
		await userEvent.clear(screen.getByLabelText('URL'))
		await userEvent.type(screen.getByLabelText('URL'), 'https://example.com')
		await userEvent.click(screen.getByRole('button', { name: 'Apply' }))

		expect(editor.getHTML()).toContain('href="https://example.com"')
		expect(editor.getHTML()).toContain('>notes</a>')
	})

	it('removes an existing link', async () => {
		const editor = new Editor({
			extensions,
			content: 'Read the [notes](https://example.com)',
		})
		editor.commands.setTextSelection({ from: 10, to: 15 })
		render(
			<EditorContext.Provider value={{ editor }}>
				<BubbleMenuContent />
			</EditorContext.Provider>
		)
		expect(editor.getHTML()).toContain('href="https://example.com"')

		await userEvent.click(screen.getByTitle('Unlink'))

		expect(editor.getHTML()).not.toContain('href=')
	})

	it('seeds the URL field with the link already on the selection', async () => {
		const editor = new Editor({
			extensions,
			content: 'Read the [notes](https://example.com)',
		})
		editor.commands.setTextSelection({ from: 10, to: 15 })
		render(
			<EditorContext.Provider value={{ editor }}>
				<BubbleMenuContent />
			</EditorContext.Provider>
		)

		await userEvent.click(screen.getByTitle('Link'))

		expect(screen.getByLabelText('URL')).toHaveValue('https://example.com')
	})
})

describe('colours', () => {
	it('sets the colour of the selection', async () => {
		const editor = new Editor({ extensions, content: 'Some notes' })
		editor.commands.setTextSelection({ from: 6, to: 11 })
		render(
			<EditorContext.Provider value={{ editor }}>
				<BubbleMenuContent />
			</EditorContext.Provider>
		)

		await userEvent.click(screen.getAllByTitle('Set color')[0])

		expect(
			editor.isActive('textStyle', { color: 'oklch(63.7% 0.237 25.331)' })
		).toBe(true)
	})

	it('clears the colour when the same swatch is picked again', async () => {
		const editor = new Editor({ extensions, content: 'Some notes' })
		editor.commands.setTextSelection({ from: 6, to: 11 })
		render(
			<EditorContext.Provider value={{ editor }}>
				<BubbleMenuContent />
			</EditorContext.Provider>
		)

		await userEvent.click(screen.getAllByTitle('Set color')[0])
		await userEvent.click(screen.getAllByTitle('Set color')[0])

		expect(
			editor.isActive('textStyle', { color: 'oklch(63.7% 0.237 25.331)' })
		).toBe(false)
	})
})

describe('reset', () => {
	it('clears marks and heading level from the selection', async () => {
		const editor = new Editor({ extensions, content: '## Some notes' })
		editor.commands.setTextSelection({ from: 6, to: 11 })
		editor.commands.setMark('bold')
		render(
			<EditorContext.Provider value={{ editor }}>
				<BubbleMenuContent />
			</EditorContext.Provider>
		)

		await userEvent.click(screen.getByTitle('Reset all styles and formatting'))

		expect(editor.getHTML()).toContain('<p>Some notes</p>')
		expect(editor.getHTML()).not.toContain('<strong>')
	})
})
