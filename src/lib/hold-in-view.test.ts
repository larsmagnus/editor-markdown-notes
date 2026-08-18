import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { holdInView } from '@/lib/hold-in-view'

/**
 * happy-dom has no layout engine and so no real `scrollIntoView`; what matters
 * here is when it is called and when it stops, which a spy answers exactly.
 */
function createTarget() {
	const element = document.createElement('span')
	element.scrollIntoView = vi.fn()
	document.body.append(element)

	return element
}

beforeEach(() => {
	vi.useFakeTimers()
})

afterEach(() => {
	vi.useRealTimers()
	document.body.innerHTML = ''
})

describe('holdInView', () => {
	it('centres the element immediately', () => {
		const element = createTarget()

		holdInView(() => element)

		expect(element.scrollIntoView).toHaveBeenCalledWith({
			block: 'center',
			inline: 'nearest',
		})
	})

	/**
	 * The page keeps changing height well after first paint - images decode,
	 * mermaid renders, Shiki arrives - so one call lands against a document that
	 * no longer exists by the time the reader sees it.
	 */
	it('keeps re-centring while the page is still settling', () => {
		const element = createTarget()

		holdInView(() => element)
		vi.advanceTimersByTime(500)

		expect(element.scrollIntoView).toHaveBeenCalledTimes(6)
	})

	it('stops once the settling window has passed', () => {
		const element = createTarget()
		const onSettled = vi.fn()

		holdInView(() => element, { onSettled })
		vi.advanceTimersByTime(3000)
		const settledAfter = vi.mocked(element.scrollIntoView).mock.calls.length

		vi.advanceTimersByTime(5000)

		expect(onSettled).toHaveBeenCalledTimes(1)
		expect(element.scrollIntoView).toHaveBeenCalledTimes(settledAfter)
	})

	it('lets go the moment the reader scrolls', () => {
		const element = createTarget()
		const onSettled = vi.fn()

		holdInView(() => element, { onSettled })
		vi.advanceTimersByTime(200)
		const before = vi.mocked(element.scrollIntoView).mock.calls.length

		window.dispatchEvent(new Event('wheel'))
		vi.advanceTimersByTime(1000)

		expect(onSettled).toHaveBeenCalledTimes(1)
		expect(element.scrollIntoView).toHaveBeenCalledTimes(before)
	})

	it('stops when torn down, which is what unmounting does', () => {
		const element = createTarget()

		const settle = holdInView(() => element)
		const before = vi.mocked(element.scrollIntoView).mock.calls.length
		settle()
		vi.advanceTimersByTime(1000)

		expect(element.scrollIntoView).toHaveBeenCalledTimes(before)
	})

	/**
	 * Re-read every tick rather than captured once, because a node view
	 * remounting replaces the element behind our back - a captured one would
	 * then be centring a node that is no longer in the document.
	 */
	it('follows the element when it is replaced mid-flight', () => {
		const first = createTarget()
		const second = createTarget()
		let current = first

		holdInView(() => current)
		current = second
		vi.advanceTimersByTime(300)

		expect(second.scrollIntoView).toHaveBeenCalled()
	})
})
