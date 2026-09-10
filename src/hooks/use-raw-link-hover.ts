import type { RefObject } from 'react'
import { useEffect, useState } from 'react'

/**
 * Which link's parens content the mouse currently sits over while Cmd (mac)
 * / Ctrl (win/linux) is held, in raw mode - drives `RawMarkdownHighlight`'s
 * underline and the textarea's pointer cursor, the same affordance VS
 * Code's own text editor gives a followable link.
 *
 * A textarea cannot style its own text, and the highlighted mirror behind
 * it (`RawMarkdownHighlight`) is `pointer-events-none` precisely so clicks
 * reach the textarea instead - which also makes it invisible to the DOM's
 * own hit-testing (`elementFromPoint`, `:hover`, `caretPositionFromPoint`).
 * So hovering is measured by hand: every render of `overlayRef`'s tree
 * marks a link's parens content with `data-link-range`, and this compares
 * the last known mouse point against each marked span's own
 * `getClientRects()` - plural, since a wrapped span's *bounding* rect would
 * otherwise cover the gap between its wrapped lines as if it were part of
 * the span.
 *
 * The modifier is read off the mouse/keyboard event itself rather than
 * tracked as a separate "which keys are down" model - `mousemove` already
 * carries `metaKey`/`ctrlKey`, and a `keydown`/`keyup` re-evaluates against
 * the last known point so pressing the modifier while already sitting still
 * over a link's text shows the affordance immediately, without waiting for
 * the next mouse move.
 */
export function useRawLinkHover(
	textareaRef: RefObject<HTMLTextAreaElement | null>,
	overlayRef: RefObject<HTMLPreElement | null>
): number | null {
	const [activeIndex, setActiveIndex] = useState<number | null>(null)

	useEffect(() => {
		const textarea = textareaRef.current
		if (!textarea) return

		let point: { x: number; y: number } | null = null
		let modifierHeld = false

		function evaluate() {
			const overlay = overlayRef.current
			if (!point || !modifierHeld || !overlay) {
				setActiveIndex(null)
				return
			}

			const spans = overlay.querySelectorAll<HTMLElement>('[data-link-range]')
			for (const span of spans) {
				for (const rect of span.getClientRects()) {
					if (
						point.x >= rect.left &&
						point.x <= rect.right &&
						point.y >= rect.top &&
						point.y <= rect.bottom
					) {
						setActiveIndex(Number(span.dataset.linkRange))
						return
					}
				}
			}

			setActiveIndex(null)
		}

		function handleMouseMove(event: MouseEvent) {
			point = { x: event.clientX, y: event.clientY }
			modifierHeld = event.metaKey || event.ctrlKey
			evaluate()
		}

		function handleMouseLeave() {
			point = null
			setActiveIndex(null)
		}

		function handleKeyChange(event: KeyboardEvent) {
			modifierHeld = event.metaKey || event.ctrlKey
			evaluate()
		}

		function handleBlur() {
			modifierHeld = false
			setActiveIndex(null)
		}

		textarea.addEventListener('mousemove', handleMouseMove)
		textarea.addEventListener('mouseleave', handleMouseLeave)
		window.addEventListener('keydown', handleKeyChange)
		window.addEventListener('keyup', handleKeyChange)
		window.addEventListener('blur', handleBlur)

		return () => {
			textarea.removeEventListener('mousemove', handleMouseMove)
			textarea.removeEventListener('mouseleave', handleMouseLeave)
			window.removeEventListener('keydown', handleKeyChange)
			window.removeEventListener('keyup', handleKeyChange)
			window.removeEventListener('blur', handleBlur)
		}
	}, [textareaRef, overlayRef])

	return activeIndex
}
