import { describe, expect, it } from 'vitest'

import { createLiveModeView } from '#src/lib/mode-switch/live-mode-view'
import { createEditor } from '#src/test-utils/editor'

describe('createLiveModeView', () => {
	/**
	 * TipTap rebuilds its editor while a switch can still be settling, and the
	 * settle loop keeps calling into the view it was given.
	 */
	it('goes inert once its editor is destroyed', () => {
		const editor = createEditor('Shipped the importer.', { mount: true })
		const view = createLiveModeView(editor)

		editor.destroy()

		expect(() => view.setSelection({ anchor: 3, head: 3 })).not.toThrow()
		expect(() => view.focus()).not.toThrow()
		expect(view.offsetRect(3)).toBeNull()
		expect(view.offsetAtY(10)).toBeNull()
	})
})
