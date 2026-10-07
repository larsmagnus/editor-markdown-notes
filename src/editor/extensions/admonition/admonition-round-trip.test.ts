import { describe, expect, it } from 'vitest'

import { createEditor } from '#src/test-utils/editor'

function roundTrip(markdown: string): string {
	const editor = createEditor()
	editor.commands.setContent(markdown)
	return String(editor.storage.markdown.getMarkdown()).trimEnd()
}

describe('admonition round trip', () => {
	it.each(['NOTE', 'TIP', 'IMPORTANT', 'WARNING', 'CAUTION'])(
		'keeps a %s alert byte-for-byte',
		(type) => {
			const markdown = [`> [!${type}]`, '> Back up the vault first.'].join('\n')
			expect(roundTrip(markdown)).toBe(markdown)
		}
	)

	it('keeps a multi-paragraph body', () => {
		const markdown = ['> [!WARNING]', '> First.', '>', '> Second.'].join('\n')
		expect(roundTrip(markdown)).toBe(markdown)
	})

	it('keeps inline formatting at the start of the body', () => {
		const markdown = ['> [!TIP]', '> **Bold** opener'].join('\n')
		expect(roundTrip(markdown)).toBe(markdown)
	})

	it('keeps a list inside the body', () => {
		const markdown = ['> [!NOTE]', '> - one', '> - two'].join('\n')
		expect(roundTrip(markdown)).toBe(markdown)
	})

	it.each([
		['trailing spaces', '> [!NOTE]  \n> Body'],
		['a backslash', '> [!NOTE]\\\n> Body'],
	])(
		'normalises a hard break after the tag written as %s',
		(_name, markdown) => {
			expect(roundTrip(markdown)).toBe('> [!NOTE]\n> Body')
		}
	)

	it('keeps a tag with no body', () => {
		expect(roundTrip('> [!NOTE]')).toBe('> [!NOTE]')
	})

	it('leaves an unknown type as a plain blockquote', () => {
		const markdown = ['> [!FOO]', '> Body'].join('\n')
		expect(roundTrip(markdown)).toBe(markdown)
	})
})
