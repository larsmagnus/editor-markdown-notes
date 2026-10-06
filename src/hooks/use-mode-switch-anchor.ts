import type { Editor } from '@tiptap/react'
import type { RefObject } from 'react'
import { useEffectEvent, useLayoutEffect, useRef, useState } from 'react'

import { captureViewAnchor } from '#src/lib/mode-switch/capture-view-anchor'
import type { ViewAnchor } from '#src/lib/mode-switch/capture-view-anchor'
import { holdViewAnchor } from '#src/lib/mode-switch/hold-view-anchor'
import { createLiveModeView } from '#src/lib/mode-switch/live-mode-view'
import type { ModeView } from '#src/lib/mode-switch/mode-view'
import { createRawModeView } from '#src/lib/mode-switch/raw-mode-view'
import type { RawModeElements } from '#src/lib/mode-switch/raw-mode-view'

interface ModeSwitchAnchorOptions {
	/** The mode asked for. */
	raw: boolean
	liveEditor: Editor | null
	rawElementsRef: RefObject<RawModeElements | null>
	scrollContainerRef?: RefObject<HTMLElement | null>
}

/**
 * Carries the caret, the selection and the text on screen across a switch
 * between live and raw mode. Returns which mode to actually show.
 *
 * That lags `raw` by one commit, landing before paint: reading where the
 * reader is needs the leaving mode still laid out, and once it is hidden
 * there is nothing left to measure.
 */
export function useModeSwitchAnchor({
	raw,
	liveEditor,
	rawElementsRef,
	scrollContainerRef,
}: ModeSwitchAnchorOptions): boolean {
	const [shownRaw, setShownRaw] = useState(raw)
	const anchorRef = useRef<ViewAnchor | null>(null)

	const modeView = useEffectEvent((isRaw: boolean): ModeView | null => {
		if (isRaw) {
			const elements = rawElementsRef.current
			return elements ? createRawModeView(elements) : null
		}
		return liveEditor && !liveEditor.isDestroyed
			? createLiveModeView(liveEditor)
			: null
	})

	useLayoutEffect(() => {
		if (raw === shownRaw) return

		const leaving = modeView(shownRaw)
		const container = scrollContainerRef?.current
		anchorRef.current =
			leaving && container ? captureViewAnchor(leaving, container) : null
		// Measure, then render with the result - react.dev's own
		// `useLayoutEffect` example. Deriving `shownRaw` instead would mean
		// reading the DOM during render.
		// oxlint-disable-next-line react/set-state-in-effect
		setShownRaw(raw)
	}, [raw, shownRaw, scrollContainerRef])

	useLayoutEffect(() => {
		const anchor = anchorRef.current
		anchorRef.current = null

		const arriving = modeView(shownRaw)
		const container = scrollContainerRef?.current
		if (!anchor || !arriving || !container) return

		return holdViewAnchor(anchor, arriving, container)
	}, [shownRaw, scrollContainerRef])

	return shownRaw
}
