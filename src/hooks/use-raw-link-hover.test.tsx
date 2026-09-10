import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useRawLinkHover } from '#src/hooks/use-raw-link-hover'

function makeRect(
	left: number,
	top: number,
	width: number,
	height: number
): DOMRect {
	return {
		left,
		top,
		right: left + width,
		bottom: top + height,
		width,
		height,
		x: left,
		y: top,
		toJSON: () => ({}),
	} as DOMRect
}

/** Real layout doesn't run under happy-dom, so hover-testing against a
 *  span's actual rendered rect only makes sense in a real browser (e2e) -
 *  this stubs the geometry to test the hook's own event-wiring/comparison
 *  logic instead. */
function stubRect(element: HTMLElement, rect: DOMRect) {
	vi.spyOn(element, 'getClientRects').mockReturnValue([
		rect,
	] as unknown as DOMRectList)
}

function setUp() {
	const textarea = document.createElement('textarea')
	const overlay = document.createElement('pre')
	const span = document.createElement('span')
	span.dataset.linkRange = '0'
	overlay.appendChild(span)
	document.body.append(textarea, overlay)
	stubRect(span, makeRect(0, 0, 100, 20))

	return { textarea, overlay, span }
}

afterEach(() => {
	vi.restoreAllMocks()
	document.body.replaceChildren()
})

describe('useRawLinkHover', () => {
	it('reports the link range under the mouse while the modifier is held', () => {
		const { textarea, overlay } = setUp()
		const { result } = renderHook(() =>
			useRawLinkHover({ current: textarea }, { current: overlay })
		)

		act(() => {
			textarea.dispatchEvent(
				new MouseEvent('mousemove', { clientX: 10, clientY: 10, metaKey: true })
			)
		})

		expect(result.current).toBe(0)
	})

	it('reports nothing over the same point without the modifier held', () => {
		const { textarea, overlay } = setUp()
		const { result } = renderHook(() =>
			useRawLinkHover({ current: textarea }, { current: overlay })
		)

		act(() => {
			textarea.dispatchEvent(
				new MouseEvent('mousemove', { clientX: 10, clientY: 10 })
			)
		})

		expect(result.current).toBeNull()
	})

	it('reports nothing when the mouse is outside every link range', () => {
		const { textarea, overlay } = setUp()
		const { result } = renderHook(() =>
			useRawLinkHover({ current: textarea }, { current: overlay })
		)

		act(() => {
			textarea.dispatchEvent(
				new MouseEvent('mousemove', {
					clientX: 500,
					clientY: 500,
					metaKey: true,
				})
			)
		})

		expect(result.current).toBeNull()
	})

	it('shows the affordance immediately on pressing the modifier over a still mouse', () => {
		const { textarea, overlay } = setUp()
		const { result } = renderHook(() =>
			useRawLinkHover({ current: textarea }, { current: overlay })
		)

		act(() => {
			textarea.dispatchEvent(
				new MouseEvent('mousemove', { clientX: 10, clientY: 10 })
			)
		})
		expect(result.current).toBeNull()

		act(() => {
			window.dispatchEvent(new KeyboardEvent('keydown', { metaKey: true }))
		})

		expect(result.current).toBe(0)
	})

	it('clears the affordance on releasing the modifier', () => {
		const { textarea, overlay } = setUp()
		const { result } = renderHook(() =>
			useRawLinkHover({ current: textarea }, { current: overlay })
		)

		act(() => {
			textarea.dispatchEvent(
				new MouseEvent('mousemove', { clientX: 10, clientY: 10, metaKey: true })
			)
		})
		expect(result.current).toBe(0)

		act(() => {
			window.dispatchEvent(new KeyboardEvent('keyup', {}))
		})

		expect(result.current).toBeNull()
	})

	it('clears the affordance when the mouse leaves the textarea', () => {
		const { textarea, overlay } = setUp()
		const { result } = renderHook(() =>
			useRawLinkHover({ current: textarea }, { current: overlay })
		)

		act(() => {
			textarea.dispatchEvent(
				new MouseEvent('mousemove', { clientX: 10, clientY: 10, metaKey: true })
			)
		})
		expect(result.current).toBe(0)

		act(() => {
			textarea.dispatchEvent(new MouseEvent('mouseleave'))
		})

		expect(result.current).toBeNull()
	})

	it('clears the affordance when the window loses focus', () => {
		const { textarea, overlay } = setUp()
		const { result } = renderHook(() =>
			useRawLinkHover({ current: textarea }, { current: overlay })
		)

		act(() => {
			textarea.dispatchEvent(
				new MouseEvent('mousemove', { clientX: 10, clientY: 10, metaKey: true })
			)
		})
		expect(result.current).toBe(0)

		act(() => {
			window.dispatchEvent(new FocusEvent('blur'))
		})

		expect(result.current).toBeNull()
	})
})
