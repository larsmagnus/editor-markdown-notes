import { afterEach, describe, expect, it, vi } from 'vitest'

import { readScrollTop, writeScrollTop } from '@/lib/scroll-position'

afterEach(() => {
	delete window.vscode
	delete window.initialScrollTop
	sessionStorage.clear()
})

describe('inside VSCode', () => {
	it('reads the offset the host injected', () => {
		window.vscode = {
			postMessage: vi.fn(),
			getState: vi.fn(),
			setState: vi.fn(),
		}
		window.initialScrollTop = 1840

		expect(readScrollTop('roadmap.md')).toBe(1840)
	})

	/**
	 * VSCode destroys the webview when the tab is merely backgrounded, then
	 * reloads it from the HTML it already holds - whose injected offset is frozen
	 * at whatever it was when the note first opened. The panel's own state is the
	 * only thing carrying anything newer across that.
	 */
	it('prefers the panel state to a stale injected offset', () => {
		window.vscode = {
			postMessage: vi.fn(),
			getState: () => ({ scrollTop: 2400 }),
			setState: vi.fn(),
		}
		window.initialScrollTop = 1840

		expect(readScrollTop('roadmap.md')).toBe(2400)
	})

	// A panel restored at the top has state saying 0, which is a real answer and
	// not the absence of one - it must not fall through to the injected offset.
	it('honours a panel state of its own that says the top', () => {
		window.vscode = {
			postMessage: vi.fn(),
			getState: () => ({ scrollTop: 0 }),
			setState: vi.fn(),
		}
		window.initialScrollTop = 1840

		expect(readScrollTop('roadmap.md')).toBe(0)
	})

	it('keeps the offset in the panel state as well as sending it', () => {
		const setState = vi.fn()
		window.vscode = { postMessage: vi.fn(), getState: vi.fn(), setState }

		writeScrollTop('roadmap.md', 1840)

		expect(setState).toHaveBeenCalledWith({ scrollTop: 1840 })
	})

	// The host is free to be an older version than this bundle, so nothing it
	// sends can be trusted to be a usable offset. The top is always safe.
	it('opens at the top when the injected offset is unusable', () => {
		window.vscode = {
			postMessage: vi.fn(),
			getState: vi.fn(),
			setState: vi.fn(),
		}
		window.initialScrollTop = -1

		expect(readScrollTop('roadmap.md')).toBe(0)
	})

	it('sends the offset to the host, which owns it per document', () => {
		const postMessage = vi.fn()
		window.vscode = { postMessage, getState: vi.fn(), setState: vi.fn() }

		writeScrollTop('roadmap.md', 1840)

		expect(postMessage).toHaveBeenCalledWith({
			type: 'setScrollTop',
			scrollTop: 1840,
		})
	})
})

describe('standalone', () => {
	it('remembers each note separately', () => {
		writeScrollTop('roadmap.md', 1840)
		writeScrollTop('backlog.md', 320)

		expect(readScrollTop('roadmap.md')).toBe(1840)
		expect(readScrollTop('backlog.md')).toBe(320)
	})

	it('opens a note it has not seen at the top', () => {
		expect(readScrollTop('roadmap.md')).toBe(0)
	})
})
