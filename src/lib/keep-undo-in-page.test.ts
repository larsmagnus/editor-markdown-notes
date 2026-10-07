import { describe, expect, it, vi } from 'vitest'

import { keepUndoInPage } from '#src/lib/keep-undo-in-page'

describe('keepUndoInPage', () => {
	it.each([
		['Cmd+Z', { key: 'z', metaKey: true }],
		['Ctrl+Z', { key: 'z', ctrlKey: true }],
		['Cmd+Shift+Z', { key: 'Z', metaKey: true, shiftKey: true }],
		['Ctrl+Y', { key: 'y', ctrlKey: true }],
	])(
		'keeps %s from reaching the window, where VS Code listens',
		(_name, init) => {
			keepUndoInPage(document)
			const reachedWindow = vi.fn()
			window.addEventListener('keydown', reachedWindow)
			const reachedEditor = vi.fn()
			const editor = document.createElement('div')
			editor.addEventListener('keydown', reachedEditor)
			document.body.append(editor)

			editor.dispatchEvent(
				new KeyboardEvent('keydown', { ...init, bubbles: true })
			)

			expect(reachedEditor).toHaveBeenCalled()
			expect(reachedWindow).not.toHaveBeenCalled()
			window.removeEventListener('keydown', reachedWindow)
			editor.remove()
		}
	)

	it('lets every other shortcut through to VS Code', () => {
		keepUndoInPage(document)
		const reachedWindow = vi.fn()
		window.addEventListener('keydown', reachedWindow)

		document.body.dispatchEvent(
			new KeyboardEvent('keydown', { key: 's', metaKey: true, bubbles: true })
		)

		expect(reachedWindow).toHaveBeenCalled()
		window.removeEventListener('keydown', reachedWindow)
	})
})
