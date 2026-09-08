import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EditorContext } from '@tiptap/react'
import { describe, expect, it } from 'vitest'

import { BubbleMenuContent } from '@/components/bubble-menu-content'
import { createEditor } from '@/test-utils/editor'

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
		const editor = createEditor('Some notes', { parseOnly: true })
		editor.commands.setTextSelection({ from: 6, to: 11 })
		render(
			<EditorContext.Provider value={{ editor }}>
				<BubbleMenuContent />
			</EditorContext.Provider>
		)

		await userEvent.click(screen.getByTitle('Heading'))
		await userEvent.click(screen.getByTitle('Heading 2'))

		// The `##` marker is real, marked text now (see `heading-extension.ts`),
		// not markup synthesized only at save time.
		expect(editor.getHTML()).toContain('<h2>## Some notes</h2>')
	})
})

describe('text styles', () => {
	it('bolds the selection', async () => {
		const editor = createEditor('Some notes', { parseOnly: true })
		editor.commands.setTextSelection({ from: 6, to: 11 })
		render(
			<EditorContext.Provider value={{ editor }}>
				<BubbleMenuContent />
			</EditorContext.Provider>
		)

		await userEvent.click(screen.getByTitle('bold'))

		// The `**` delimiters are real, marked text now (see `formatting/`),
		// not markup synthesized only at save time.
		expect(editor.getHTML()).toContain('<strong>**notes**</strong>')
	})

	it('italicises the selection', async () => {
		const editor = createEditor('Some notes', { parseOnly: true })
		editor.commands.setTextSelection({ from: 6, to: 11 })
		render(
			<EditorContext.Provider value={{ editor }}>
				<BubbleMenuContent />
			</EditorContext.Provider>
		)

		await userEvent.click(screen.getByTitle('italic'))

		// The `_` delimiters are real, marked text now (see `formatting/`),
		// not markup synthesized only at save time.
		expect(editor.getHTML()).toContain('<em>_notes_</em>')
	})

	it('strikes through the selection', async () => {
		const editor = createEditor('Some notes', { parseOnly: true })
		editor.commands.setTextSelection({ from: 6, to: 11 })
		render(
			<EditorContext.Provider value={{ editor }}>
				<BubbleMenuContent />
			</EditorContext.Provider>
		)

		await userEvent.click(screen.getByTitle('strike'))

		// The `~~` delimiters are real, marked text now (see `formatting/`),
		// not markup synthesized only at save time.
		expect(editor.getHTML()).toContain('<s>~~notes~~</s>')
	})
})

describe('links', () => {
	it('applies the typed URL to the selection', async () => {
		const editor = createEditor('Read the notes', { parseOnly: true })
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

		// The `[`/`](url)` delimiters are real, marked text now (see
		// `link-extension.ts`), not markup synthesized only at save time.
		expect(editor.getHTML()).toContain('href="https://example.com"')
		expect(editor.getHTML()).toContain('>[notes](https://example.com)</a>')
	})

	it('removes an existing link', async () => {
		const editor = createEditor('Read the [notes](https://example.com)', {
			parseOnly: true,
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
		const editor = createEditor('Read the [notes](https://example.com)', {
			parseOnly: true,
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

	// Regression: applying a new URL over an existing link used to only touch
	// the mark's attrs, leaving the old URL's literal text - now the visible
	// source of truth - sitting stale right beside it.
	it('replaces the literal URL text when editing an existing link', async () => {
		const editor = createEditor('Read the [notes](https://old.example.com)')
		editor.commands.setTextSelection({ from: 10, to: 15 })
		render(
			<EditorContext.Provider value={{ editor }}>
				<BubbleMenuContent />
			</EditorContext.Provider>
		)

		await userEvent.click(screen.getByTitle('Link'))
		await userEvent.clear(screen.getByLabelText('URL'))
		await userEvent.type(
			screen.getByLabelText('URL'),
			'https://new.example.com'
		)
		await userEvent.click(screen.getByRole('button', { name: 'Apply' }))

		const markdown = editor.storage.markdown.getMarkdown() as string
		expect(markdown).toContain('[notes](https://new.example.com)')
		expect(markdown).not.toContain('old.example.com')
	})
})

describe('colours', () => {
	it('sets the colour of the selection', async () => {
		const editor = createEditor('Some notes', { parseOnly: true })
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
		const editor = createEditor('Some notes', { parseOnly: true })
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

	it('clears only the colour, leaving other formatting intact', async () => {
		const editor = createEditor('## Some notes', { parseOnly: true })
		editor.commands.setTextSelection({ from: 6, to: 11 })
		editor.commands.setMark('bold')
		render(
			<EditorContext.Provider value={{ editor }}>
				<BubbleMenuContent />
			</EditorContext.Provider>
		)

		await userEvent.click(screen.getAllByTitle('Set color')[0])
		await userEvent.click(screen.getByTitle('Clear color'))

		expect(
			editor.isActive('textStyle', { color: 'oklch(63.7% 0.237 25.331)' })
		).toBe(false)
		expect(editor.getHTML()).toContain('<h2>')
		expect(editor.getHTML()).toContain('<strong>')
	})
})
