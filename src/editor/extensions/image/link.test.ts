import type { Command } from '@tiptap/pm/state'
import { Editor } from '@tiptap/react'
import { afterEach, describe, expect, it } from 'vitest'

import { extensions } from '@/editor/extensions/extensions'
import { setImageLink, unsetImageLink } from '@/editor/extensions/image/link'

const editors: Editor[] = []

afterEach(() => {
	editors.forEach((editor) => editor.destroy())
	editors.length = 0
})

function makeEditor(content: string): Editor {
	const editor = new Editor({ extensions, content })
	editors.push(editor)
	return editor
}

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
		const editor = makeEditor('![Diagram](./diagram.png)')

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
		const editor = makeEditor(
			'[![Diagram](./diagram.png)](https://example.com)'
		)

		apply(editor, unsetImageLink(imagePos(editor)))

		expect(editor.storage.markdown.getMarkdown()).toBe(
			'![Diagram](./diagram.png)'
		)
	})
})

it('declines both commands at a position that is not an image', () => {
	const editor = makeEditor('![Diagram](./diagram.png)')

	expect(apply(editor, setImageLink(0, { href: 'https://example.com' }))).toBe(
		false
	)
	expect(apply(editor, unsetImageLink(0))).toBe(false)
})
