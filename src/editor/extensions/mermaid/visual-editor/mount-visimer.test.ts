import type { Editor } from '@tiptap/react'
import { describe, expect, it, vi } from 'vitest'

import { mountVisimer } from '#src/editor/extensions/mermaid/visual-editor/mount-visimer'

vi.mock('mermaid', () => ({ default: {} }))
vi.mock('@visimer/dom', () => ({
	MermaidCanvasView: class {
		constructor() {
			throw new Error('the canvas could not start')
		}
	},
}))

function mountOptions() {
	const frame = document.createElement('div')
	const canvas = document.createElement('div')
	frame.append(canvas)
	document.body.append(frame)

	return {
		frame,
		canvas,
		options: {
			editor: {} as Editor,
			getPos: () => 0,
			code: 'graph TD\n  A --> B',
			dark: false,
			frame,
			canvas,
			onSelectionChange: () => {},
			onConnectingChange: () => {},
		},
	}
}

describe('mountVisimer', () => {
	it('reports why the canvas could not start', async () => {
		const { options } = mountOptions()

		await expect(mountVisimer(options)).rejects.toThrow(
			'the canvas could not start'
		)
	})

	// A shield left behind would swallow every press on the editor's own
	// buttons in the next mount.
	it('stops shielding presses on its chrome once the canvas fails to start', async () => {
		const { frame, options } = mountOptions()
		const button = document.createElement('button')
		frame.append(button)
		const reachedLaterListener = vi.fn()
		document.addEventListener('pointerdown', reachedLaterListener)

		await mountVisimer(options).catch(() => {})
		button.dispatchEvent(new Event('pointerdown', { bubbles: true }))

		expect(reachedLaterListener).toHaveBeenCalledOnce()
		document.removeEventListener('pointerdown', reachedLaterListener)
	})
})
