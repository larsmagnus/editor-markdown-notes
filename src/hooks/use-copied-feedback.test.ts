import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useCopiedFeedback } from '@/hooks/use-copied-feedback'

beforeEach(() => {
	vi.useFakeTimers()
})

afterEach(() => {
	vi.useRealTimers()
})

describe('useCopiedFeedback', () => {
	it('starts false', () => {
		const { result } = renderHook(() => useCopiedFeedback(1500))

		expect(result.current[0]).toBe(false)
	})

	it('flips true when shown, then false again once the duration elapses', () => {
		const { result } = renderHook(() => useCopiedFeedback(1500))

		act(() => result.current[1]())
		expect(result.current[0]).toBe(true)

		act(() => vi.advanceTimersByTime(1499))
		expect(result.current[0]).toBe(true)

		act(() => vi.advanceTimersByTime(1))
		expect(result.current[0]).toBe(false)
	})

	it('keeps the original schedule when shown again while already showing', () => {
		const { result } = renderHook(() => useCopiedFeedback(1500))

		act(() => result.current[1]())
		act(() => vi.advanceTimersByTime(1000))
		// Calling show() again is a no-op while already true, so this does not
		// push the hide-time out to 1000 + 1500 - it still hides at 1500 from
		// the first call.
		act(() => result.current[1]())
		act(() => vi.advanceTimersByTime(500))

		expect(result.current[0]).toBe(false)
	})
})
