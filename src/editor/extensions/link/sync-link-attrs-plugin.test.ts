import { Editor } from '@tiptap/react'
import { afterEach, describe, expect, it } from 'vitest'

import { extensions } from '@/editor/extensions/extensions'
import { findMarkRuns } from '@/editor/extensions/formatting/find-mark-runs'

const editors: Editor[] = []

afterEach(() => {
	editors.forEach((editor) => editor.destroy())
	editors.length = 0
})

function linkRunEnd(editor: Editor): number {
	const [run] = findMarkRuns(editor.state.doc, editor.schema.marks.link)
	return run.to
}

describe('createSyncLinkAttrsPlugin', () => {
	it('updates href/title attrs to match a directly-edited closing delimiter', () => {
		const editor = new Editor({ extensions, content: '' })
		editors.push(editor)
		// `setContent` runs the plugins that build the run's real delimiter
		// text; constructing with `content` directly does not (see
		// `inline-code-delimiter-spec.test.ts`'s own regression on the same
		// asymmetry).
		editor.commands.setContent('Read [the notes](https://old.example.com) now')

		// The run ends with `)`; the href sits right before it. Replace
		// "old.example.com" with "new.example.com" by editing the revealed
		// text directly, the way a user edits an existing link (see
		// `link-extension.ts`).
		const runEnd = linkRunEnd(editor)
		const from = runEnd - ')'.length - 'old.example.com'.length
		const to = runEnd - ')'.length
		editor.commands.insertContentAt({ from, to }, 'new.example.com')

		expect(editor.getAttributes('link').href).toBe('https://new.example.com')
	})

	it('leaves attrs untouched when the text already matches them, even after an unrelated edit', () => {
		const editor = new Editor({
			extensions,
			content: 'Read [the notes](https://example.com) now',
		})
		editors.push(editor)

		editor.commands.insertContentAt(editor.state.doc.content.size, '!')

		const [run] = findMarkRuns(editor.state.doc, editor.schema.marks.link)
		expect(run.mark.attrs.href).toBe('https://example.com')
	})
})
