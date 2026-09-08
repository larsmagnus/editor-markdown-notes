import type { Command } from '@tiptap/pm/state'
import { Editor } from '@tiptap/react'
import { describe, expect, it } from 'vitest'

import { setImageLink, unsetImageLink } from '#src/editor/extensions/image/link'
import { createEditor } from '#src/test-utils/editor'

/** Runs `command` against `editor`'s own state and dispatch. */
function apply(editor: Editor, command: Command): boolean {
	return command(editor.state, editor.view.dispatch)
}

/** The sole image node's own position in the document. */
function imagePos(editor: Editor): number {
	let pos: number | null = null
	editor.state.doc.descendants((node, at) => {
		if (node.type.name === 'image') pos = at
	})
	if (pos === null) throw new Error('no image found')
	return pos
}

describe('setImageLink', () => {
	it('wraps a bare image in a link', () => {
		const editor = createEditor('![Diagram](./diagram.png)', {
			parseOnly: true,
		})

		apply(
			editor,
			setImageLink(imagePos(editor), { href: 'https://example.com' })
		)

		expect(editor.storage.markdown.getMarkdown()).toBe(
			'[![Diagram](./diagram.png)](https://example.com)'
		)
	})
})

describe('unsetImageLink', () => {
	it('removes the link, leaving the bare image', () => {
		const editor = createEditor(
			'[![Diagram](./diagram.png)](https://example.com)',
			{ parseOnly: true }
		)

		apply(editor, unsetImageLink(imagePos(editor)))

		expect(editor.storage.markdown.getMarkdown()).toBe(
			'![Diagram](./diagram.png)'
		)
	})
})

it('declines both commands at a position that is not an image', () => {
	const editor = createEditor('![Diagram](./diagram.png)', { parseOnly: true })

	expect(apply(editor, setImageLink(0, { href: 'https://example.com' }))).toBe(
		false
	)
	expect(apply(editor, unsetImageLink(0))).toBe(false)
})
