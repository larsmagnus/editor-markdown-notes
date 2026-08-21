import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { scrollRestoreTop } from '@/lib/scroll/scroll-restore-top'

/**
 * happy-dom has no layout engine, so `scrollHeight` and `clientHeight` are
 * always 0 and `scrollTop` never clamps itself. Both are defined here instead,
 * which is what lets a test say "the document is still short" and then grow it.
 */
function createScrollContainer(scrollHeight: number, clientHeight = 600) {
	const container = document.createElement('div')
	document.body.append(container)

	let height = scrollHeight
	Object.defineProperty(container, 'scrollHeight', { get: () => height })
	Object.defineProperty(container, 'clientHeight', { get: () => clientHeight })

	return {
		container,
		grow(to: number) {
			height = to
		},
	}
}

beforeEach(() => {
	vi.useFakeTimers()
})

afterEach(() => {
	vi.useRealTimers()
	document.body.innerHTML = ''
})

describe('scrollRestoreTop', () => {
	/**
	 * Standalone, the file selector swaps notes underneath the one scroll
	 * container, so a note that has never been opened has to be *put* at the top
	 * rather than assumed to be there - it would otherwise inherit wherever the
	 * previous note was left, and go on to record that as its own position.
	 */
	it('puts a note that has never been opened at the top', () => {
		const { container } = createScrollContainer(4000)
		const onSettled = vi.fn()
		container.scrollTop = 1800

		scrollRestoreTop(container, 0, { onSettled })

		expect(container.scrollTop).toBe(0)
		expect(onSettled).toHaveBeenCalled()
	})

	it('scrolls straight to a target the document is already tall enough for', () => {
		const { container } = createScrollContainer(4000)

		scrollRestoreTop(container, 1200)

		expect(container.scrollTop).toBe(1200)
	})

	/**
	 * The case the whole module exists for: images, mermaid diagrams and Shiki
	 * highlighting all land after first paint, so the document a mount-time
	 * offset is measured against is shorter than the one the reader left.
	 */
	it('re-applies the target as the document grows to reach it', () => {
		const { container, grow } = createScrollContainer(1000)

		scrollRestoreTop(container, 1800)

		// Only 400px of scrolling exists yet - as far towards the target as it goes.
		expect(container.scrollTop).toBe(400)

		grow(3000)
		vi.advanceTimersByTime(100)

		expect(container.scrollTop).toBe(1800)
	})

	/**
	 * Content appearing above the viewport carries the reader's place down with
	 * it - the browser's own scroll anchoring, and the lazily-loaded toolbar is
	 * enough to cause it. Letting go at the first reachable moment left that
	 * shift in place and recorded it, so a note crept further down its own page
	 * on every reopen.
	 */
	it('puts the position back after a later shift', () => {
		const { container, grow } = createScrollContainer(4000)

		scrollRestoreTop(container, 1200)

		// The toolbar arriving above the viewport, and the anchoring that follows.
		grow(4056)
		container.scrollTop = 1256
		container.dispatchEvent(new Event('scroll'))

		vi.advanceTimersByTime(100)

		expect(container.scrollTop).toBe(1200)
	})

	/**
	 * VSCode's find widget lives in VSCode's own chrome rather than in this
	 * document, so scrolling a match into view fires none of the takeover events
	 * a reader's own scrolling would - and the match would be pulled straight
	 * back off screen. An unchanged height is what tells that apart from the
	 * scroll anchoring above, which only ever follows the page growing.
	 */
	it('lets go when something outside the page scrolls it', () => {
		const { container } = createScrollContainer(4000)
		const onSettled = vi.fn()

		scrollRestoreTop(container, 1200, { onSettled })

		container.scrollTop = 3000
		container.dispatchEvent(new Event('scroll'))
		expect(onSettled).toHaveBeenCalled()

		vi.advanceTimersByTime(1000)

		expect(container.scrollTop).toBe(3000)
	})

	it('stops fighting the reader once they scroll for themselves', () => {
		const { container } = createScrollContainer(4000)
		const onSettled = vi.fn()

		scrollRestoreTop(container, 1200, { onSettled })
		container.dispatchEvent(new Event('wheel'))
		expect(onSettled).toHaveBeenCalled()

		container.scrollTop = 50
		vi.advanceTimersByTime(1000)

		expect(container.scrollTop).toBe(50)
	})

	it('hands the page back once the settling window has passed', () => {
		const { container } = createScrollContainer(4000)
		const onSettled = vi.fn()

		scrollRestoreTop(container, 1200, { timeoutMs: 3000, onSettled })
		vi.advanceTimersByTime(2999)
		expect(onSettled).not.toHaveBeenCalled()

		vi.advanceTimersByTime(1)
		container.scrollTop = 50
		vi.advanceTimersByTime(1000)

		expect(onSettled).toHaveBeenCalled()
		expect(container.scrollTop).toBe(50)
	})
})
