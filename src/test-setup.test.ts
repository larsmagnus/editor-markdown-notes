import { Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { describe, expect, it } from 'vitest'

let leaked: Editor | null = null

/**
 * Guards the global teardown in `test-setup.ts`. It hooks `updateState`
 * because `EditorView`'s constructor happens to call it; an upgrade that stops
 * doing so would leave every editor alive again, and the only symptom would be
 * CI failing on an unhandled `document is not defined` in an unrelated file.
 */
describe('the editor teardown every test file gets for free', () => {
	it('an editor a test never destroys', () => {
		leaked = new Editor({ extensions: [StarterKit], content: '<p>hello</p>' })

		expect(leaked.view.isDestroyed).toBe(false)
	})

	it('is destroyed once that test ends', () => {
		expect(leaked?.view.isDestroyed).toBe(true)
	})
})
