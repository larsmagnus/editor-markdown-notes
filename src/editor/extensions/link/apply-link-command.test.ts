import { describe, expect, it } from 'vitest'

import { createApplyLinkCommand } from '@/editor/extensions/link/apply-link-command'
import { createEditor } from '@/test-utils/editor'

describe('createApplyLinkCommand', () => {
	it('wraps a plain selection in a fresh link', () => {
		const editor = createEditor('Read the notes', { parseOnly: true })
		editor.commands.setTextSelection({ from: 10, to: 15 })

		createApplyLinkCommand(editor.schema.marks.link, {
			href: 'https://example.com',
		})(editor.state, editor.view.dispatch)

		expect(editor.getHTML()).toContain('>[notes](https://example.com)</a>')
	})

	it('declines on an empty selection with no existing link', () => {
		const editor = createEditor('Read the notes', { parseOnly: true })
		editor.commands.setTextSelection(10)

		const applied = createApplyLinkCommand(editor.schema.marks.link, {
			href: 'https://example.com',
		})(editor.state, editor.view.dispatch)

		expect(applied).toBe(false)
	})

	it('replaces an existing link’s URL, not just its attrs, when the caret sits inside it', () => {
		const editor = createEditor(
			'Read [the notes](https://old.example.com) now',
			{ parseOnly: true }
		)
		editor.commands.setTextSelection(10)

		createApplyLinkCommand(editor.schema.marks.link, {
			href: 'https://new.example.com',
		})(editor.state, editor.view.dispatch)

		expect(editor.storage.markdown.getMarkdown()).toContain(
			'[the notes](https://new.example.com)'
		)
		expect(editor.storage.markdown.getMarkdown()).not.toContain(
			'old.example.com'
		)
	})

	it('sets a title alongside the href', () => {
		const editor = createEditor('Read the notes', { parseOnly: true })
		editor.commands.setTextSelection({ from: 10, to: 15 })

		createApplyLinkCommand(editor.schema.marks.link, {
			href: 'https://example.com',
			title: 'The docs',
		})(editor.state, editor.view.dispatch)

		expect(editor.storage.markdown.getMarkdown()).toContain(
			'[notes](https://example.com "The docs")'
		)
	})
})
