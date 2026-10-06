import { describe, expect, it, vi } from 'vitest'

import { holdViewAnchor } from '#src/lib/mode-switch/hold-view-anchor'

describe('holdViewAnchor', () => {
	it('pins the nearest laid-out line above when the anchored text has no layout', () => {
		const text = 'Intro line\nDiagram heading\ngraph TD\nOutro line'
		const headingStart = text.indexOf('Diagram heading')
		const container = document.createElement('div')

		const settle = holdViewAnchor(
			{
				text,
				selection: { anchor: 0, head: 0 },
				wasFocused: false,
				offset: text.indexOf('TD'),
				viewportY: 5,
				atTop: false,
			},
			{
				root: document.createElement('div'),
				text: () => text,
				selection: () => ({ anchor: 0, head: 0 }),
				setSelection: vi.fn(),
				hasFocus: () => false,
				focus: vi.fn(),
				// Only the heading is laid out: the diagram source behind it is not.
				offsetRect: (offset) =>
					offset === headingStart ? new DOMRect(0, 20, 0, 20) : null,
				offsetAtY: () => 0,
			},
			container
		)
		settle()

		expect(container.scrollTop).toBe(20 - 5)
	})

	it('leaves the scroll alone when there was nothing to pin, still carrying the selection', () => {
		const text = 'Intro line\nOutro line'
		const setSelection = vi.fn()
		const container = document.createElement('div')
		container.scrollTop = 140

		const settle = holdViewAnchor(
			{
				text,
				selection: { anchor: 3, head: 3 },
				wasFocused: false,
				offset: null,
				viewportY: 5,
				atTop: false,
			},
			{
				root: document.createElement('div'),
				text: () => text,
				selection: () => ({ anchor: 0, head: 0 }),
				setSelection,
				hasFocus: () => false,
				focus: vi.fn(),
				offsetRect: () => new DOMRect(0, 60, 0, 20),
				offsetAtY: () => 0,
			},
			container
		)
		settle()

		expect(container.scrollTop).toBe(140)
		expect(setSelection).toHaveBeenCalledWith({ anchor: 3, head: 3 })
	})
})
