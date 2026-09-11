import StarterKit from '@tiptap/starter-kit'
import { describe, expect, it, vi } from 'vitest'

import { interceptShortcutsWhileSelected } from '#src/editor/extensions/formatting/intercept-shortcuts-while-selected'
import { createEditor } from '#src/test-utils/editor'

describe('interceptShortcutsWhileSelected', () => {
	it('passes through a declining shortcut when nothing is selected', () => {
		const editor = createEditor('<p>hello world</p>', {
			extensions: [StarterKit],
		})
		editor.commands.setTextSelection(1)
		const decline = vi.fn().mockReturnValue(false)

		const wrapped = interceptShortcutsWhileSelected(editor, {
			'Mod-b': decline,
		})

		expect(wrapped['Mod-b']?.({ editor })).toBe(false)
	})

	it('forces a declining shortcut to report handled when text is selected', () => {
		const editor = createEditor('<p>hello world</p>', {
			extensions: [StarterKit],
		})
		editor.commands.setTextSelection({ from: 1, to: 6 })
		const decline = vi.fn().mockReturnValue(false)

		const wrapped = interceptShortcutsWhileSelected(editor, {
			'Mod-b': decline,
		})

		expect(wrapped['Mod-b']?.({ editor })).toBe(true)
	})

	it('still reports handled when the shortcut itself succeeds', () => {
		const editor = createEditor('<p>hello world</p>', {
			extensions: [StarterKit],
		})
		editor.commands.setTextSelection({ from: 1, to: 6 })
		const accept = vi.fn().mockReturnValue(true)

		const wrapped = interceptShortcutsWhileSelected(editor, { 'Mod-b': accept })

		expect(wrapped['Mod-b']?.({ editor })).toBe(true)
		expect(accept).toHaveBeenCalled()
	})
})
