import { describe, expect, it } from 'vitest'

import { createEditor, saved } from '#src/test-utils/editor'

describe('pasting text that looks like an address', () => {
	it('links a URL with a scheme', () => {
		const editor = createEditor('Read more:')
		editor.commands.focus('end')

		editor.view.pasteText(' https://example.com')

		expect(saved(editor)).toBe('Read more: <https://example.com>')
	})

	it('links a URL ending in a closing paren', () => {
		const editor = createEditor('See')
		editor.commands.focus('end')

		editor.view.pasteText(' https://en.wikipedia.org/wiki/Foo_(bar)')

		expect(editor.getHTML()).toContain(
			'href="https://en.wikipedia.org/wiki/Foo_(bar)"'
		)
	})

	it('links a mailto address', () => {
		const editor = createEditor('Write to')
		editor.commands.focus('end')

		editor.view.pasteText(' mailto:user-123@example.com')

		expect(editor.getHTML()).toContain('href="mailto:user-123@example.com"')
	})

	it('leaves a www. address as text', () => {
		const editor = createEditor('Read more:')
		editor.commands.focus('end')

		editor.view.pasteText(' www.example.com')

		expect(saved(editor)).toBe('Read more: www.example.com')
	})

	it('leaves a file name as text', () => {
		const editor = createEditor('Open')
		editor.commands.focus('end')

		editor.view.pasteText(' notes.md')

		expect(saved(editor)).toBe('Open notes.md')
	})
})
