import { renderHook } from '@testing-library/react'
import { Editor } from '@tiptap/core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { extensions } from '@/editor/extensions'
import { useSearchReveal } from '@/hooks/use-search-reveal'

const NOTE = 'Ask for an email address.'

const editors: Editor[] = []

function createEditor() {
	const editor = new Editor({ extensions, content: NOTE })
	editors.push(editor)

	return editor
}

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
	for (const editor of editors.splice(0)) editor.destroy()
	vi.clearAllMocks()
})

describe('useSearchReveal', () => {
	it('highlights the match on the editor it is given', () => {
		const editor = createEditor()

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
		const first = createEditor()
		const { rerender } = renderHook(({ editor }) => useSearchReveal(editor), {
			initialProps: { editor: first },
		})
		expect(highlighted(first)).toBe('email')

		const second = createEditor()
		rerender({ editor: second })

		expect(highlighted(second)).toBe('email')
	})

	it('does nothing on an ordinary open', () => {
		delete window.searchReveal
		const editor = createEditor()

		renderHook(() => useSearchReveal(editor))

		expect(highlighted(editor)).toBe('')
		expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled()
	})
})
