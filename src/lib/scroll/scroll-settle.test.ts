import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createSettleLoop } from '@/lib/scroll/scroll-settle'

beforeEach(() => {
	vi.useFakeTimers()
})

afterEach(() => {
	vi.useRealTimers()
})

describe('createSettleLoop', () => {
	it('runs apply immediately, before the first interval tick', () => {
		const apply = vi.fn()

		createSettleLoop(apply, () => () => {})

		expect(apply).toHaveBeenCalledTimes(1)
	})

	it('keeps re-applying on the interval until the timeout passes', () => {
		const apply = vi.fn()

		createSettleLoop(apply, () => () => {}, { timeoutMs: 500 })
		vi.advanceTimersByTime(300)

		// One immediate call, then one every 100ms.
		expect(apply).toHaveBeenCalledTimes(4)
	})

	it('stops applying and reports settled once the timeout passes', () => {
		const apply = vi.fn()
		const onSettled = vi.fn()

		createSettleLoop(apply, () => () => {}, { timeoutMs: 500, onSettled })
		vi.advanceTimersByTime(500)
		const callsAtSettle = apply.mock.calls.length

		vi.advanceTimersByTime(1000)

		expect(onSettled).toHaveBeenCalledTimes(1)
		expect(apply).toHaveBeenCalledTimes(callsAtSettle)
	})

	it('detaches the takeover listener once the timeout passes', () => {
		const detach = vi.fn()

		createSettleLoop(
			() => {},
			() => detach,
			{ timeoutMs: 500 }
		)
		vi.advanceTimersByTime(500)

		expect(detach).toHaveBeenCalledTimes(1)
	})

	it('settles as soon as the takeover callback fires, before the timeout', () => {
		const apply = vi.fn()
		const onSettled = vi.fn()
		const detach = vi.fn()
		let takeover: (() => void) | undefined

		createSettleLoop(
			apply,
			(settle) => {
				takeover = settle
				return detach
			},
			{ timeoutMs: 3000, onSettled }
		)
		vi.advanceTimersByTime(200)
		const callsBeforeTakeover = apply.mock.calls.length

		takeover?.()
		vi.advanceTimersByTime(1000)

		expect(onSettled).toHaveBeenCalledTimes(1)
		expect(detach).toHaveBeenCalledTimes(1)
		expect(apply).toHaveBeenCalledTimes(callsBeforeTakeover)
	})

	it('only settles once, even if the returned settle is called repeatedly', () => {
		const onSettled = vi.fn()
		const detach = vi.fn()

		const settle = createSettleLoop(
			() => {},
			() => detach,
			{ onSettled }
		)

		settle()
		settle()
		settle()

		expect(onSettled).toHaveBeenCalledTimes(1)
		expect(detach).toHaveBeenCalledTimes(1)
	})

	it('lets the caller end the loop early through the returned settle', () => {
		const apply = vi.fn()
		const onSettled = vi.fn()

		const settle = createSettleLoop(apply, () => () => {}, {
			timeoutMs: 3000,
			onSettled,
		})
		vi.advanceTimersByTime(200)
		const callsBeforeSettle = apply.mock.calls.length

		settle()
		vi.advanceTimersByTime(1000)

		expect(onSettled).toHaveBeenCalledTimes(1)
		expect(apply).toHaveBeenCalledTimes(callsBeforeSettle)
	})
})
