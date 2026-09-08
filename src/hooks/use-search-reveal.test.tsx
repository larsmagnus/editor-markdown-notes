import { renderHook } from '@testing-library/react'
import { Editor } from '@tiptap/core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useSearchReveal } from '#src/hooks/use-search-reveal'
import { createEditor } from '#src/test-utils/editor'

const NOTE = 'Ask for an email address.'

/** The decorated text, which is the only outward sign the reveal ran. */
function highlighted(editor: Editor): string {
	return [...editor.view.dom.querySelectorAll('.search-reveal-match')]
		.map((span) => span.textContent)
		.join('')
}

beforeEach(() => {
	Element.prototype.scrollIntoView = vi.fn()
	window.searchReveal = {
		line: 0,
		column: 12,
		text: 'email',
		lineOffset: 0,
	}
})

afterEach(() => {
	delete window.searchReveal
	vi.clearAllMocks()
})

describe('useSearchReveal', () => {
	it('highlights the match on the editor it is given', () => {
		const editor = createEditor(NOTE, { parseOnly: true })

		renderHook(() => useSearchReveal(editor))

		expect(highlighted(editor)).toBe('email')
	})

	/**
	 * TipTap rebuilds the editor during startup, so the instance the reveal first
	 * sees is not always the one that ends up on screen. A "run only once" ref
	 * let that discarded editor consume the reveal, and the real one was left
	 * with neither a highlight nor a scroll - which is exactly what happened, and
	 * what no test caught, because happy-dom's editor never rebuilds on its own.
	 */
	it('reveals again when the editor is rebuilt underneath it', () => {
		const first = createEditor(NOTE, { parseOnly: true })
		const { rerender } = renderHook(({ editor }) => useSearchReveal(editor), {
			initialProps: { editor: first },
		})
		expect(highlighted(first)).toBe('email')

		const second = createEditor(NOTE, { parseOnly: true })
		rerender({ editor: second })

		expect(highlighted(second)).toBe('email')
	})

	it('does nothing on an ordinary open', () => {
		delete window.searchReveal
		const editor = createEditor(NOTE, { parseOnly: true })

		renderHook(() => useSearchReveal(editor))

		expect(highlighted(editor)).toBe('')
		expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled()
	})
})
