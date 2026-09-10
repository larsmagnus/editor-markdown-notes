import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { hasHeadingReveal, takeHeadingReveal } from '#src/lib/heading-reveal'

const REVEAL = { hash: 'title' }

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
	delete window.headingReveal
})

describe('takeHeadingReveal', () => {
	it('hands back the hash the host injected', () => {
		window.headingReveal = REVEAL

		expect(takeHeadingReveal()).toEqual(REVEAL)
	})

	it('reveals nothing on an ordinary open, where the host injected nothing', () => {
		expect(takeHeadingReveal()).toBeUndefined()
		expect(hasHeadingReveal()).toBe(false)
	})

	/**
	 * VS Code destroys the webview when a tab is backgrounded and rebuilds it
	 * from the HTML it already holds, so the injected reveal comes back looking
	 * brand new every time the reader switches back.
	 */
	it('is owed only once, across a rebuild of the page', () => {
		window.headingReveal = REVEAL
		expect(takeHeadingReveal()).toEqual(REVEAL)

		expect(hasHeadingReveal()).toBe(false)
		expect(takeHeadingReveal()).toBeUndefined()
	})

	it('reveals nothing when the payload is unusable', () => {
		window.headingReveal = 'not a reveal at all' as unknown as NonNullable<
			typeof window.headingReveal
		>

		expect(takeHeadingReveal()).toBeUndefined()
	})
})

describe('hasHeadingReveal', () => {
	it('reports a reveal without consuming it', () => {
		window.headingReveal = REVEAL

		expect(hasHeadingReveal()).toBe(true)
		expect(hasHeadingReveal()).toBe(true)
		expect(takeHeadingReveal()).toEqual(REVEAL)
	})
})
