import type { Editor } from '@tiptap/core'
import { ReactRenderer } from '@tiptap/react'

import { AskPromptInputWithBoundary } from '@/editor/slash-command/ask-prompt-input-with-boundary'

/**
 * Mounts the free-text ask box at `pos`, positioned by hand via
 * `coordsAtPos` rather than `Suggestion`'s floating-ui `mount()` used by
 * `render.ts` - this runs after the slash menu has already closed normally
 * (the command's `run` already fired), so there is no `Suggestion` lifecycle
 * left to hook a render into.
 */
export function openAskPromptPopup(
	editor: Editor,
	pos: number,
	onSubmit: (prompt: string) => void
) {
	const container = document.createElement('div')
	container.style.position = 'fixed'
	container.style.zIndex = '50'
	document.body.appendChild(container)

	const coords = editor.view.coordsAtPos(pos)
	container.style.left = `${coords.left}px`
	container.style.top = `${coords.bottom + 4}px`

	let closed = false
	const close = () => {
		if (closed) return
		closed = true
		component.destroy()
		container.remove()
	}

	const component = new ReactRenderer(AskPromptInputWithBoundary, {
		editor,
		props: {
			onSubmit: (prompt: string) => {
				close()
				onSubmit(prompt)
			},
			onCancel: close,
		},
	})

	container.appendChild(component.element)
}
