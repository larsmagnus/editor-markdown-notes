import '@testing-library/jest-dom/vitest'

import { cleanup } from '@testing-library/react'
import { Editor } from '@tiptap/core'
import { afterEach } from 'vitest'

import { MOUNT_SELECTOR } from '@/test-utils/mount-point'

const editors = new Set<Editor>()

/**
 * Every editor a test builds, so none outlives the test that made it.
 *
 * An editor left alive keeps its `DOMObserver`'s pending timer, which fires
 * after the file's happy-dom environment is gone and throws `document is not
 * defined` out of the timer queue, where no test can catch it. Vitest reports it
 * as an unhandled error and fails the run - on CI, whose slower machine is what
 * puts the timer past teardown, while every local run stays green. It lands in
 * whichever file happens to be running, never the one that leaked.
 *
 * Registered here rather than per test file so it cannot be forgotten: the
 * constructor mounts the editor itself, and `mount` is public.
 *
 * `destroy()` rather than `view.destroy()`, because only the former runs
 * `extensionManager.destroy()` - the extensions' `onDestroy`, which is where the
 * ask widgets unmount the single React root they share.
 */
const mount = Editor.prototype.mount
Editor.prototype.mount = function (this: Editor, element) {
	editors.add(this)
	mount.call(this, element)
}

afterEach(() => {
	// React first: unmounting is how a component-owned editor destroys itself,
	// and what is left after it is a genuine leak.
	cleanup()

	for (const editor of editors) {
		if (!editor.isDestroyed) editor.destroy()
	}
	editors.clear()

	// The mount points `createEditor` makes. A destroyed view removes its own
	// `dom`, never the container it was handed.
	for (const element of document.querySelectorAll(MOUNT_SELECTOR)) {
		element.remove()
	}
})
