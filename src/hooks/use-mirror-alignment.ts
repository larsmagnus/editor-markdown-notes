import type { RefObject } from 'react'
import { useEffect, useRef, useState } from 'react'

/**
 * How many lines each layer lays the text out over, or `null` where nothing
 * is laid out to count (a hidden view, or no layout engine at all).
 */
function lineCounts(
	textarea: HTMLTextAreaElement,
	overlay: HTMLElement
): { textarea: number; mirror: number } | null {
	const lineHeight = Number.parseFloat(getComputedStyle(textarea).lineHeight)
	const end = overlay.querySelector('[data-mirror-end]')
	if (!end || !Number.isFinite(lineHeight) || lineHeight <= 0) return null
	if (textarea.scrollHeight === 0) return null

	const top = overlay.getBoundingClientRect().top
	return {
		textarea: Math.round(textarea.scrollHeight / lineHeight),
		mirror:
			Math.round((end.getBoundingClientRect().top - top) / lineHeight) + 1,
	}
}

/**
 * Whether raw mode's colored mirror still lays its text out over as many
 * lines as the textarea over it does.
 *
 * Any difference means a line wraps in one layer and not the other - a font
 * that failed to load, a style this app did not anticipate - and from that
 * line down the author would see one character while the textarea holds
 * another, so clicks and deletions land on text they cannot see. The caller
 * shows the textarea's own text instead, uncolored but where it really is.
 */
export function useMirrorAlignment(
	textareaRef: RefObject<HTMLTextAreaElement | null>,
	overlayRef: RefObject<HTMLElement | null>,
	text: string
): boolean {
	const [aligned, setAligned] = useState(true)

	const measureRef = useRef<() => void>(() => {})

	// Set up once: the observer catches a resize, and every text change asks
	// for one measurement after the frame it lands in rather than forcing a
	// layout of its own before paint.
	useEffect(() => {
		const textarea = textareaRef.current
		const overlay = overlayRef.current
		if (!textarea || !overlay) return

		let frame = 0
		const measureNow = () => {
			frame = 0
			const counts = lineCounts(textarea, overlay)
			const next = !counts || counts.textarea === counts.mirror
			setAligned((previous) => {
				if (previous && !next && counts) {
					console.warn(
						`Raw view highlighting wraps over ${counts.mirror} lines where the text takes ${counts.textarea}; showing plain text instead.`
					)
				}
				return next
			})
		}
		measureRef.current = () => {
			if (frame === 0) frame = requestAnimationFrame(measureNow)
		}

		measureNow()
		if (typeof ResizeObserver === 'undefined') return
		const observer = new ResizeObserver(measureRef.current)
		observer.observe(textarea)
		return () => {
			observer.disconnect()
			cancelAnimationFrame(frame)
		}
	}, [textareaRef, overlayRef])

	useEffect(() => {
		measureRef.current()
	}, [text])

	return aligned
}
