import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Editor, EditorContext } from '@tiptap/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { BubbleMenuContent } from '@/editor/bubble-menu-content'
import { extensions } from '@/editor/extensions'

let currentEditor: Editor | undefined

afterEach(() => {
	currentEditor?.destroy()
	currentEditor = undefined
})

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
		currentEditor = editor
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
		currentEditor = editor
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
		currentEditor = editor
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
		currentEditor = editor
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
		currentEditor = editor
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
		currentEditor = editor
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
		currentEditor = editor
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
		currentEditor = editor
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
		currentEditor = editor
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

describe('images', () => {
	it('shows only image controls when an image is selected', async () => {
		const editor = new Editor({
			extensions,
			content: '<img src="./diagram.png" alt="Diagram">',
		})
		currentEditor = editor
		editor.commands.setNodeSelection(1)
		render(
			<EditorContext.Provider value={{ editor }}>
				<BubbleMenuContent />
			</EditorContext.Provider>
		)

		expect(screen.getByTitle('Edit image')).toBeInTheDocument()
		expect(screen.getByTitle('Delete image')).toBeInTheDocument()
		expect(screen.queryByTitle('Heading')).not.toBeInTheDocument()
		expect(screen.queryByTitle('bold')).not.toBeInTheDocument()
	})

	it('seeds the edit popover with the image current src and alt', async () => {
		const editor = new Editor({
			extensions,
			content: '<img src="./diagram.png" alt="Diagram">',
		})
		currentEditor = editor
		editor.commands.setNodeSelection(1)
		render(
			<EditorContext.Provider value={{ editor }}>
				<BubbleMenuContent />
			</EditorContext.Provider>
		)

		await userEvent.click(screen.getByTitle('Edit image'))

		expect(screen.getByLabelText('Src')).toHaveValue('./diagram.png')
		expect(screen.getByLabelText('Alt')).toHaveValue('Diagram')
	})

	it('updates the image src and alt text', async () => {
		const editor = new Editor({
			extensions,
			content: '<img src="./diagram.png" alt="Diagram">',
		})
		currentEditor = editor
		editor.commands.setNodeSelection(1)
		render(
			<EditorContext.Provider value={{ editor }}>
				<BubbleMenuContent />
			</EditorContext.Provider>
		)

		await userEvent.click(screen.getByTitle('Edit image'))
		await userEvent.clear(screen.getByLabelText('Src'))
		await userEvent.type(screen.getByLabelText('Src'), './new-diagram.png')
		await userEvent.clear(screen.getByLabelText('Alt'))
		await userEvent.type(screen.getByLabelText('Alt'), 'New diagram')
		await userEvent.click(screen.getByRole('button', { name: 'Apply' }))

		expect(editor.getHTML()).toContain('src="./new-diagram.png"')
		expect(editor.getHTML()).toContain('alt="New diagram"')
	})

	it('deletes the image', async () => {
		const editor = new Editor({
			extensions,
			content: '<img src="./diagram.png" alt="Diagram">',
		})
		currentEditor = editor
		editor.commands.setNodeSelection(1)
		render(
			<EditorContext.Provider value={{ editor }}>
				<BubbleMenuContent />
			</EditorContext.Provider>
		)

		await userEvent.click(screen.getByTitle('Delete image'))

		expect(editor.getHTML()).not.toContain('<img')
	})

	it('wraps the image in a link', async () => {
		const editor = new Editor({
			extensions,
			content: '<img src="./diagram.png" alt="Diagram">',
		})
		currentEditor = editor
		editor.commands.setNodeSelection(1)
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
		expect(editor.getHTML()).toContain('<img')
	})

	it('unwraps a linked image', async () => {
		const editor = new Editor({
			extensions,
			content:
				'<a href="https://example.com"><img src="./diagram.png" alt="Diagram"></a>',
		})
		currentEditor = editor
		editor.commands.setNodeSelection(1)
		render(
			<EditorContext.Provider value={{ editor }}>
				<BubbleMenuContent />
			</EditorContext.Provider>
		)
		expect(editor.getHTML()).toContain('href="https://example.com"')

		await userEvent.click(screen.getByTitle('Unlink'))

		expect(editor.getHTML()).not.toContain('href=')
		expect(editor.getHTML()).toContain('<img')
	})
})

describe('image keyboard navigation', () => {
	it('moves focus into the toolbar when ArrowRight is pressed on a selected image', () => {
		const editor = new Editor({
			extensions,
			content: '<img src="./diagram.png" alt="Diagram">',
		})
		currentEditor = editor
		editor.commands.setNodeSelection(1)
		render(
			<EditorContext.Provider value={{ editor }}>
				<BubbleMenuContent />
			</EditorContext.Provider>
		)

		fireEvent.keyDown(editor.view.dom, { key: 'ArrowRight' })

		expect(screen.getByTitle('Edit image')).toHaveFocus()
	})

	it('cycles through the toolbar buttons with arrow keys, wrapping at the ends', async () => {
		const editor = new Editor({
			extensions,
			content: '<img src="./diagram.png" alt="Diagram">',
		})
		currentEditor = editor
		editor.commands.setNodeSelection(1)
		render(
			<EditorContext.Provider value={{ editor }}>
				<BubbleMenuContent />
			</EditorContext.Provider>
		)
		screen.getByTitle('Edit image').focus()

		await userEvent.keyboard('{ArrowRight}')
		expect(screen.getByTitle('Link')).toHaveFocus()

		await userEvent.keyboard('{ArrowRight}')
		expect(screen.getByTitle('Unlink')).toHaveFocus()

		await userEvent.keyboard('{ArrowRight}')
		expect(screen.getByTitle('Delete image')).toHaveFocus()

		await userEvent.keyboard('{ArrowRight}')
		expect(screen.getByTitle('Edit image')).toHaveFocus()

		await userEvent.keyboard('{ArrowLeft}')
		expect(screen.getByTitle('Delete image')).toHaveFocus()
	})

	it('moves Tab from a toolbar button on to the next image', async () => {
		const editor = new Editor({
			extensions,
			content:
				'<img src="./first.png" alt="First"><img src="./second.png" alt="Second">',
		})
		currentEditor = editor
		editor.commands.setNodeSelection(1)
		render(
			<EditorContext.Provider value={{ editor }}>
				<BubbleMenuContent />
			</EditorContext.Provider>
		)
		screen.getByTitle('Edit image').focus()

		await userEvent.keyboard('{Tab}')

		expect(editor.getAttributes('image').alt).toBe('Second')
	})

	it('returns Shift-Tab from a toolbar button to the image', async () => {
		const editor = new Editor({
			extensions,
			content: '<img src="./diagram.png" alt="Diagram">',
		})
		currentEditor = editor
		editor.commands.setNodeSelection(1)
		render(
			<EditorContext.Provider value={{ editor }}>
				<BubbleMenuContent />
			</EditorContext.Provider>
		)
		// `editor.view.dom` never mounts into `document` in these tests (see the
		// file banner), so `document.activeElement` can't observe this focus -
		// a spy is the only thing that can. It's the editor that regains focus,
		// not the `<img>` - see `exitImageToolbar`'s comment for why.
		const focusEditor = vi.spyOn(editor.view, 'focus')
		screen.getByTitle('Edit image').focus()

		await userEvent.keyboard('{Shift>}{Tab}{/Shift}')

		expect(focusEditor).toHaveBeenCalled()
	})

	it('moves Tab between fields inside the edit popover instead of to the next image', async () => {
		const editor = new Editor({
			extensions,
			content: '<img src="./diagram.png" alt="Diagram">',
		})
		currentEditor = editor
		editor.commands.setNodeSelection(1)
		render(
			<EditorContext.Provider value={{ editor }}>
				<BubbleMenuContent />
			</EditorContext.Provider>
		)

		await userEvent.click(screen.getByTitle('Edit image'))
		screen.getByLabelText('Src').focus()
		await userEvent.keyboard('{Tab}')

		expect(screen.getByLabelText('Alt')).toHaveFocus()
	})
})

describe('reset', () => {
	it('clears marks and heading level from the selection', async () => {
		const editor = new Editor({ extensions, content: '## Some notes' })
		currentEditor = editor
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
