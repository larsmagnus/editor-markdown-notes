import { Editor } from '@tiptap/react'
import { afterEach, describe, expect, it } from 'vitest'

import { extensions } from '@/editor/extensions'

const editors: Editor[] = []

/**
 * Runs markdown through the exact extension set the app ships with, then reads
 * it back out the same way the auto-save does. Anything the schema drops on the
 * way in is silently lost on the way out, so this is the guarantee that matters.
 */
function roundTrip(markdown: string): string {
	const editor = new Editor({ extensions, content: '' })
	editors.push(editor)
	// `setContent` is how editor.tsx loads content, and it runs plugins that
	// constructing with `content` does not. Testing the other path hides bugs.
	editor.commands.setContent(markdown)
	// Block nodes close with a trailing newline; it carries no meaning here.
	return String(editor.storage.markdown.getMarkdown()).trimEnd()
}

afterEach(() => {
	editors.forEach((editor) => editor.destroy())
	editors.length = 0
})

describe('tables', () => {
	it('keeps a table intact', () => {
		const markdown = [
			'| Quarter | Revenue | Growth |',
			'| --- | --- | --- |',
			'| Q1 2025 | 1.2M | 8% |',
			'| Q2 2025 | 1.4M | 17% |',
		].join('\n')

		expect(roundTrip(markdown)).toBe(markdown)
	})

	it('keeps inline formatting inside cells', () => {
		const markdown = [
			'| Feature | Status | Docs |',
			'| --- | --- | --- |',
			'| Tables | **shipped** | [guide](https://example.com) |',
			'| Config | `tightLists` | *pending* |',
		].join('\n')

		expect(roundTrip(markdown)).toBe(markdown)
	})

	it('keeps a header-only table', () => {
		const markdown = ['| Name | Owner |', '| --- | --- |'].join('\n')

		expect(roundTrip(markdown)).toBe(markdown)
	})

	it('drops column alignment entirely - it neither renders nor round-trips', () => {
		const markdown = [
			'| Left | Centered | Right |',
			'| :--- | :---: | ---: |',
			'| a | b | c |',
		].join('\n')

		expect(roundTrip(markdown)).toBe(
			[
				'| Left | Centered | Right |',
				'| --- | --- | --- |',
				'| a | b | c |',
			].join('\n')
		)
	})
})

describe('task lists', () => {
	it('keeps the checked state of each item', () => {
		const markdown = ['- [x] Ship table support', '- [ ] Ship footnotes'].join(
			'\n'
		)

		expect(roundTrip(markdown)).toBe(markdown)
	})

	it('keeps nested task items', () => {
		const markdown = [
			'- [x] Ship table support',
			'  - [x] Register the table nodes',
			'  - [ ] Add a table toolbar',
		].join('\n')

		expect(roundTrip(markdown)).toBe(markdown)
	})
})

describe('images and links', () => {
	it('keeps an image with its alt text', () => {
		const markdown =
			'![Editor Markdown Notes icon](/icon-editor-markdown-notes.png)'

		expect(roundTrip(markdown)).toBe(markdown)
	})

	it('keeps an image separate from the paragraph that follows it', () => {
		const markdown = [
			'![Editor Markdown Notes icon](/icon-editor-markdown-notes.png)',
			'',
			'Link',
		].join('\n')

		expect(roundTrip(markdown)).toBe(markdown)
	})

	it('does not linkify prose that merely looks like a domain', () => {
		expect(roundTrip('# notes.md')).toBe('# notes.md')
		expect(roundTrip('Open package.json to check.')).toBe(
			'Open package.json to check.'
		)
	})

	it('leaves filenames alone while still linkifying real URLs', () => {
		expect(
			roundTrip('# notes.md\n\nSee https://example.com and package.json.')
		).toBe('# notes.md\n\nSee <https://example.com> and package.json.')
	})

	it('keeps an inline link', () => {
		const markdown =
			'Read [the release notes](https://example.com/releases) first.'

		expect(roundTrip(markdown)).toBe(markdown)
	})

	it('links a bare URL and writes it back in autolink form', () => {
		expect(roundTrip('Docs live at https://example.com today.')).toBe(
			'Docs live at <https://example.com> today.'
		)
	})
})

describe('features that already worked keep working', () => {
	it('keeps all six heading levels', () => {
		const markdown = [
			'# Heading 1',
			'',
			'## Heading 2',
			'',
			'### Heading 3',
			'',
			'#### Heading 4',
			'',
			'##### Heading 5',
			'',
			'###### Heading 6',
		].join('\n')

		expect(roundTrip(markdown)).toBe(markdown)
	})

	it('keeps bold, italic and strikethrough, normalising italics to asterisks', () => {
		expect(
			roundTrip('**Bold text** and _italic text_ and ~~struck text~~')
		).toBe('**Bold text** and *italic text* and ~~struck text~~')
	})

	it('keeps inline code', () => {
		expect(roundTrip('Call `helloWorld()` to start.')).toBe(
			'Call `helloWorld()` to start.'
		)
	})

	it('keeps nested blockquotes', () => {
		const markdown = ['> Blockquote', '>', '> > Nested blockquote'].join('\n')

		expect(roundTrip(markdown)).toBe(markdown)
	})

	it('keeps nested bullet lists', () => {
		const markdown = [
			'- Unordered list item 1',
			'- Unordered list item 2',
			'  - Nested unordered item',
		].join('\n')

		expect(roundTrip(markdown)).toBe(markdown)
	})

	it('keeps nested ordered lists', () => {
		const markdown = [
			'1. Ordered list item 1',
			'2. Ordered list item 2',
			'   1. Nested ordered item',
		].join('\n')

		expect(roundTrip(markdown)).toBe(markdown)
	})

	it('keeps horizontal rules', () => {
		const markdown = ['Above the break', '', '---', '', 'Below the break'].join(
			'\n'
		)

		expect(roundTrip(markdown)).toBe(markdown)
	})

	it('keeps a fenced code block and its language tag', () => {
		const markdown = [
			'```js',
			'function helloWorld() {',
			"\tconsole.log('Hello, world!')",
			'}',
			'```',
		].join('\n')

		expect(roundTrip(markdown)).toBe(markdown)
	})
})
