import { useEffect } from 'react'

/**
 * Turns Cmd/Ctrl+S into a `vscode-save-request` event on `window`.
 *
 * The keystroke lands on the page rather than on the editor, and the editor is
 * the only thing that can serialize the document - so it listens for this
 * instead.
 */
export function useSaveShortcut(enabled: boolean) {
	useEffect(() => {
		if (!enabled) return

		const handleKeyDown = (event: KeyboardEvent) => {
			if (!(event.metaKey || event.ctrlKey) || event.key !== 's') return

			event.preventDefault()
			window.dispatchEvent(new CustomEvent('vscode-save-request'))
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [enabled])
}
