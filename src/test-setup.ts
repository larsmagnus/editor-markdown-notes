import '@testing-library/jest-dom/vitest'

import { cleanup } from '@testing-library/react'
import type { EditorState } from '@tiptap/pm/state'
import { EditorView } from '@tiptap/pm/view'
import { afterEach } from 'vitest'

const views = new Set<EditorView>()

/**
 * Every editor a test builds, so none outlives the test that made it.
 *
 * A view left alive keeps its `DOMObserver`'s pending timer, which fires after
 * the file's happy-dom environment is gone and throws `document is not defined`
 * out of the timer queue, where no test can catch it. Vitest reports it as an
 * unhandled error and fails the run - on CI, whose slower machine is what puts
 * the timer past teardown, while every local run stays green. It lands in
 * whichever file happens to be running, never the one that leaked.
 *
 * Registered here rather than per test file so it cannot be forgotten:
 * `EditorView` has no construction hook, but its constructor calls
 * `updateState` exactly once on the way out.
 */
const updateState = EditorView.prototype.updateState
EditorView.prototype.updateState = function (
	this: EditorView,
	state: EditorState
) {
	views.add(this)
	updateState.call(this, state)
}

afterEach(() => {
	// React first: unmounting is how a component-owned editor destroys itself,
	// and what is left after it is a genuine leak.
	cleanup()

	for (const view of views) {
		if (!view.isDestroyed) view.destroy()
	}
	views.clear()
})
