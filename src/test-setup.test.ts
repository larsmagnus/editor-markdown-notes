import type { Editor } from '@tiptap/core'
import { Extension } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { describe, expect, it } from 'vitest'

import { createEditor } from '#src/test-utils/editor'

let leaked: Editor | null = null
let mountPoint: Element | null = null
let destroyedExtensions = 0

const CountsItsOwnDestroy = Extension.create({
	name: 'countsItsOwnDestroy',
	onDestroy() {
		destroyedExtensions += 1
	},
})

/**
 * Guards the global teardown in `test-setup.ts`, which nothing else can: every
 * way it breaks leaves the whole suite green. It hooks `mount` because
 * `Editor`'s constructor happens to call it, so an upgrade that stops doing so
 * destroys nothing, and the only symptom is CI failing on an unhandled
 * `document is not defined` in whichever unrelated file was running.
 *
 * `onDestroy` is asserted separately because destroying the view alone does not
 * run it - and that is where the ask extensions unmount their React root.
 */
describe('the editor teardown every test file gets for free', () => {
	it('an editor a test never destroys', () => {
		leaked = createEditor('hello', {
			extensions: [StarterKit, CountsItsOwnDestroy],
			mount: true,
		})
		mountPoint = leaked.view.dom.parentElement

		expect(leaked.isDestroyed).toBe(false)
		expect(destroyedExtensions).toBe(0)
		expect(document.body.contains(mountPoint)).toBe(true)
	})

	it('is destroyed once that test ends, extensions and mount point with it', () => {
		expect(leaked?.isDestroyed).toBe(true)
		expect(destroyedExtensions).toBe(1)
		expect(document.body.contains(mountPoint)).toBe(false)
	})
})
