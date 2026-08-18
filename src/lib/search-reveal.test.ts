import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { hasSearchReveal, takeSearchReveal } from '@/lib/search-reveal'

const REVEAL = { line: 58, column: 1, text: '<input', lineOffset: 8 }

/** A panel that actually remembers what `setState` wrote, as VS Code's does. */
function stubPanel() {
	let state: unknown
	window.vscode = {
		postMessage: vi.fn(),
		getState: () => state,
		setState: (next: unknown) => {
			state = next
		},
	}
}

beforeEach(stubPanel)

afterEach(() => {
	delete window.vscode
	delete window.searchReveal
})

describe('takeSearchReveal', () => {
	it('hands back the match the host injected', () => {
		window.searchReveal = REVEAL

		expect(takeSearchReveal()).toEqual(REVEAL)
	})

	it('reveals nothing on an ordinary open, where the host injected nothing', () => {
		expect(takeSearchReveal()).toBeUndefined()
		expect(hasSearchReveal()).toBe(false)
	})

	/**
	 * VS Code destroys the webview when a tab is backgrounded and rebuilds it
	 * from the HTML it already holds, so the injected reveal comes back looking
	 * brand new every time the reader switches back. Left unrecorded, the note
	 * jumped to a long-forgotten search match on every return to the tab.
	 */
	it('is owed only once, across a rebuild of the page', () => {
		window.searchReveal = REVEAL
		expect(takeSearchReveal()).toEqual(REVEAL)

		// The panel state is all that survives; the global is injected afresh.
		expect(hasSearchReveal()).toBe(false)
		expect(takeSearchReveal()).toBeUndefined()
	})

	it('reveals nothing when the payload is unusable', () => {
		// An older host, or another extension's traffic. Every field in the schema
		// catches to a default rather than throwing, so what survives is a reveal
		// with no text - which has nothing to look for.
		window.searchReveal = 'not a reveal at all' as unknown as NonNullable<
			typeof window.searchReveal
		>

		expect(takeSearchReveal()).toBeUndefined()
	})
})

describe('hasSearchReveal', () => {
	/**
	 * Asked while rendering rather than from an effect, so it must not claim the
	 * reveal - the scroll restore and the editor both need a true answer.
	 */
	it('reports a reveal without consuming it', () => {
		window.searchReveal = REVEAL

		expect(hasSearchReveal()).toBe(true)
		expect(hasSearchReveal()).toBe(true)
		expect(takeSearchReveal()).toEqual(REVEAL)
	})
})
