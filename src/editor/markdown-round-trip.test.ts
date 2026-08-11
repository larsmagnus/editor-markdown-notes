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
	delete window.imageBaseUris
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

	it('keeps empty cells', () => {
		const markdown = [
			'| Feature | Owner |',
			'| --- | --- |',
			'| Tables |  |',
		].join('\n')

		expect(roundTrip(markdown)).toBe(markdown)
	})

	// Left bare, the pipe ends the cell and the row comes back one column wider.
	it('escapes a pipe typed into a cell', () => {
		const markdown = [
			'| Metric | Formula |',
			'| --- | --- |',
			'| Uptime | up \\| down |',
		].join('\n')

		expect(roundTrip(markdown)).toBe(markdown)
	})

	// A cell holding only an image has no text content at all, and the
	// serializer used to read that as an empty cell.
	it('keeps a cell that holds only an image', () => {
		const markdown = [
			'| Build | Status |',
			'| --- | --- |',
			'| main | ![passing](./badge.png) |',
		].join('\n')

		expect(roundTrip(markdown)).toBe(markdown)
	})

	it('falls back to HTML for merged cells, which GFM cannot express', () => {
		const merged =
			'<table><tbody><tr><th colspan="2">Merged</th></tr><tr><td>a</td><td>b</td></tr></tbody></table>'

		const result = roundTrip(merged)

		expect(result).toContain('colspan="2"')
		expect(result).toContain('Merged')
	})

	// What copying a range of body cells out of a table puts on the clipboard.
	it('keeps a table whose header row is empty', () => {
		const markdown = [
			'|  |  |',
			'| --- | --- |',
			'| Q1 2025 | 1.2M |',
			'| Q2 2025 | 1.4M |',
		].join('\n')

		expect(roundTrip(markdown)).toBe(markdown)
	})

	it('keeps a header-only table', () => {
		const markdown = ['| Name | Owner |', '| --- | --- |'].join('\n')

		expect(roundTrip(markdown)).toBe(markdown)
	})

	it('keeps a left-aligned column', () => {
		const markdown = ['| Name |', '| :--- |', '| Tables |'].join('\n')

		expect(roundTrip(markdown)).toBe(markdown)
	})

	it('keeps a centered column', () => {
		const markdown = ['| Name |', '| :---: |', '| Tables |'].join('\n')

		expect(roundTrip(markdown)).toBe(markdown)
	})

	it('keeps a right-aligned column', () => {
		const markdown = ['| Name |', '| ---: |', '| Tables |'].join('\n')

		expect(roundTrip(markdown)).toBe(markdown)
	})

	it('leaves an unaligned column unaligned', () => {
		const markdown = ['| Name |', '| --- |', '| Tables |'].join('\n')

		expect(roundTrip(markdown)).toBe(markdown)
	})

	it('keeps a mix of alignments across one table', () => {
		const markdown = [
			'| Left | Centered | Right | Plain |',
			'| :--- | :---: | ---: | --- |',
			'| a | b | c | d |',
		].join('\n')

		expect(roundTrip(markdown)).toBe(markdown)
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

	it('keeps the authored image path even when rendering resolves it', () => {
		window.imageBaseUris = {
			document:
				'https://file+.vscode-resource.vscode-cdn.net/Users/dev/notes/docs',
			workspace: 'https://file+.vscode-resource.vscode-cdn.net/Users/dev/notes',
		}

		expect(roundTrip('![Architecture](./diagram.png)')).toBe(
			'![Architecture](./diagram.png)'
		)
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

	it('keeps bold, italic and strikethrough, preserving whichever italic marker was used', () => {
		expect(
			roundTrip('**Bold text** and _italic text_ and ~~struck text~~')
		).toBe('**Bold text** and _italic text_ and ~~struck text~~')
		expect(roundTrip('*italic text*')).toBe('*italic text*')
	})

	it('keeps one contiguous bold run around inline code', () => {
		expect(roundTrip('**Add `x` command**')).toBe('**Add `x` command**')
	})

	it('keeps one contiguous italic run around inline code', () => {
		expect(roundTrip('*Add `x` command*')).toBe('*Add `x` command*')
	})

	it('keeps one contiguous strikethrough run around inline code', () => {
		expect(roundTrip('~~Add `x` command~~')).toBe('~~Add `x` command~~')
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

	// The block renders as a diagram rather than as source, so a serializer that
	// dropped it would look like a rendering bug right up until auto-save wrote
	// the loss back to the file.
	it('keeps a mermaid fence exactly as the author wrote it', () => {
		const markdown = [
			'```mermaid',
			'graph TD',
			'  A[Start] --> B{Decision}',
			'  B -->|Yes| C[Finish]',
			'```',
		].join('\n')

		expect(roundTrip(markdown)).toBe(markdown)
	})
})

describe('escaping', () => {
	it('does not escape brackets in a heading', () => {
		expect(roundTrip('## [Unreleased]')).toBe('## [Unreleased]')
	})

	it('does not escape brackets in prose that are not part of a link', () => {
		expect(roundTrip('See [notes] for details.')).toBe(
			'See [notes] for details.'
		)
	})

	it('escapes a closing bracket immediately followed by an opening paren', () => {
		expect(roundTrip('Weird](but not a link) case.')).toBe(
			'Weird\\](but not a link) case.'
		)
	})

	it('does not escape a lone tilde used as an approximation sign', () => {
		expect(roundTrip('the ~44kB gzipped stack')).toBe('the ~44kB gzipped stack')
	})

	it('keeps a single-backtick fence around code containing a triple-backtick run', () => {
		expect(roundTrip('fenced ` ```mermaid ` code blocks')).toBe(
			'fenced ` ```mermaid ` code blocks'
		)
	})

	it('does not escape an unpaired backtick', () => {
		expect(roundTrip("It's a 'tick, not a `backtick.")).toBe(
			"It's a 'tick, not a `backtick."
		)
	})

	it('does not escape a spaced, non-flanking asterisk', () => {
		expect(roundTrip('5 * 3 = 15')).toBe('5 * 3 = 15')
	})

	it('does not escape a flanking asterisk with no closing partner', () => {
		expect(roundTrip('Rated 5*')).toBe('Rated 5*')
	})

	it('still escapes a literal backslash', () => {
		expect(roundTrip('C:\\Users\\name')).toBe('C:\\\\Users\\\\name')
	})

	it('does not escape an intraword underscore that cannot form emphasis', () => {
		expect(roundTrip('snake_case_var')).toBe('snake_case_var')
	})

	it('does not escape an unrelated flanking asterisk with no real partner', () => {
		expect(roundTrip('5 * 3 and a*b')).toBe('5 * 3 and a*b')
	})

	it('does not escape backtick runs whose lengths have no match elsewhere', () => {
		expect(roundTrip('a`b c``d')).toBe('a`b c``d')
	})

	it('escapes a plain-text line shaped like a link reference definition', () => {
		const editor = new Editor({ extensions, content: '' })
		editors.push(editor)
		editor.commands.setContent({
			type: 'doc',
			content: [
				{
					type: 'paragraph',
					content: [
						{ type: 'text', text: '[MDN]: https://developer.mozilla.org' },
					],
				},
			],
		})

		const markdown = String(editor.storage.markdown.getMarkdown()).trimEnd()
		expect(markdown).toBe('\\[MDN]: https://developer.mozilla.org')

		// The escaped bracket keeps this a visible paragraph on reload rather
		// than a vanished reference definition.
		const reloaded = new Editor({ extensions, content: '' })
		editors.push(reloaded)
		reloaded.commands.setContent(markdown)
		expect(reloaded.getText()).toContain('MDN')
	})

	it('escapes asterisks that would otherwise re-parse as emphasis', () => {
		const editor = new Editor({ extensions, content: '' })
		editors.push(editor)
		editor.commands.setContent({
			type: 'doc',
			content: [
				{ type: 'paragraph', content: [{ type: 'text', text: 'a*b*c' }] },
			],
		})

		const markdown = String(editor.storage.markdown.getMarkdown()).trimEnd()
		expect(markdown).toBe('a\\*b\\*c')
		expect(roundTrip(markdown)).toBe(markdown)
	})

	it('escapes backtick runs that share a length with another run in the text', () => {
		const editor = new Editor({ extensions, content: '' })
		editors.push(editor)
		editor.commands.setContent({
			type: 'doc',
			content: [
				{ type: 'paragraph', content: [{ type: 'text', text: 'x`y``z`w' }] },
			],
		})

		const markdown = String(editor.storage.markdown.getMarkdown()).trimEnd()
		expect(markdown).toBe('x\\`y``z\\`w')
		expect(roundTrip(markdown)).toBe(markdown)
	})
})

describe('italic markup', () => {
	it('preserves an underscore-delimited italic', () => {
		expect(roundTrip('_italic text_')).toBe('_italic text_')
	})

	it('preserves an asterisk-delimited italic', () => {
		expect(roundTrip('*italic text*')).toBe('*italic text*')
	})

	it('preserves each marker independently within one paragraph', () => {
		expect(roundTrip('_one_ and *two*')).toBe('_one_ and *two*')
	})

	it('uses the configured default marker for a fresh italic with no source markup', () => {
		const editor = new Editor({ extensions, content: '' })
		editors.push(editor)
		editor.commands.setContent('hello world')
		editor.commands.setTextSelection({ from: 1, to: 6 })
		editor.commands.toggleItalic()

		expect(String(editor.storage.markdown.getMarkdown()).trimEnd()).toBe(
			'_hello_ world'
		)
	})

	it('respects a configured asterisk default for a fresh italic', () => {
		const editor = new Editor({ extensions, content: '' })
		editors.push(editor)
		editor.commands.setContent('hello world')
		editor.storage.italic.preferredMarkup = '*'
		editor.commands.setTextSelection({ from: 1, to: 6 })
		editor.commands.toggleItalic()

		expect(String(editor.storage.markdown.getMarkdown()).trimEnd()).toBe(
			'*hello* world'
		)
	})

	it('falls back to an asterisk when the default marker would land mid-word', () => {
		const editor = new Editor({ extensions, content: '' })
		editors.push(editor)
		editor.commands.setContent('helloworld')
		editor.commands.setTextSelection({ from: 6, to: 11 })
		editor.commands.toggleItalic()

		expect(String(editor.storage.markdown.getMarkdown()).trimEnd()).toBe(
			'hello*world*'
		)
	})

	it('removes italics even when the selection markup differs from the configured default', () => {
		const editor = new Editor({ extensions, content: '' })
		editors.push(editor)
		editor.commands.setContent('_italic text_')
		editor.storage.italic.preferredMarkup = '*'
		editor.commands.setTextSelection({ from: 1, to: 13 })
		editor.commands.toggleItalic()

		expect(String(editor.storage.markdown.getMarkdown()).trimEnd()).toBe(
			'italic text'
		)
	})

	it('uses the configured default marker for pasted HTML italics without a source markup', () => {
		const editor = new Editor({ extensions, content: '' })
		editors.push(editor)
		editor.storage.italic.preferredMarkup = '*'
		editor.commands.insertContent('<p><em>foo</em></p>')

		expect(String(editor.storage.markdown.getMarkdown()).trimEnd()).toBe(
			'*foo*'
		)
	})
})
