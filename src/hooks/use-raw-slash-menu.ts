import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { useEventCallback, useEventListener } from 'usehooks-ts'

import type { SlashCommandItem } from '#src/editor/extensions/slash-command/commands'
import type { SlashCommandMenuHandle } from '#src/editor/extensions/slash-command/menu'
import { filterCommands } from '#src/editor/extensions/slash-command/slash-command-extension'
import { insertTextAtSelection } from '#src/lib/insert-text-at-selection'
import { findSlashQuery } from '#src/lib/raw-slash-query'
import type { SlashQuery } from '#src/lib/raw-slash-query'
import { textOffsetRect } from '#src/lib/text-offset-rect'

export type SlashMenuAnchor = { top: number; left: number }

/** Keys that accept the highlighted command; both reach the menu as Enter. */
const ACCEPT_KEYS = new Set(['Enter', 'Tab'])
const NAVIGATE_KEYS = new Set(['ArrowUp', 'ArrowDown'])

/** Chords like Shift+Tab or Ctrl+Enter belong to the browser, not the menu. */
function hasModifier(event: KeyboardEvent): boolean {
	return event.shiftKey || event.ctrlKey || event.metaKey || event.altKey
}

function rawItems(query: string): SlashCommandItem[] {
	return filterCommands(query).filter((item) => item.raw)
}

/**
 * Drives raw mode's `/` menu: opens it for a `/query` at the start of a line,
 * claims the navigation keys while it shows, and writes the picked command's
 * markdown over the query.
 *
 * Esc dismisses until the caret leaves that `/`, so the typed text stays put
 * without the menu springing back on the next keystroke.
 */
export function useRawSlashMenu(
	textareaRef: RefObject<HTMLTextAreaElement | null>,
	overlayRef: RefObject<HTMLPreElement | null>,
	wrapperRef: RefObject<HTMLDivElement | null>,
	draft: string,
	active: boolean
) {
	const menuRef = useRef<SlashCommandMenuHandle>(null)
	const [slash, setSlash] = useState<SlashQuery | null>(null)
	const [anchor, setAnchor] = useState<SlashMenuAnchor | null>(null)
	const dismissedFrom = useRef<number | null>(null)

	// Stable per query: the menu resets its highlight whenever `items` changes
	// identity, which a fresh array every render would do on each keystroke.
	const query = slash?.query
	const items = useMemo(
		() => (query === undefined ? [] : rawItems(query)),
		[query]
	)
	const open = active && slash !== null && items.length > 0

	const sync = useEventCallback(() => {
		const textarea = textareaRef.current
		if (!textarea) return
		const found =
			textarea.selectionStart === textarea.selectionEnd
				? findSlashQuery(textarea.value, textarea.selectionStart)
				: null
		if (found?.from !== dismissedFrom.current) dismissedFrom.current = null
		setSlash(dismissedFrom.current === null ? found : null)
	})

	const select = useEventCallback((item: SlashCommandItem) => {
		const textarea = textareaRef.current
		if (!textarea || !slash || !item.raw) return
		textarea.setSelectionRange(slash.from, textarea.selectionStart)
		insertTextAtSelection(textarea, item.raw.text, item.raw.caretOffset)
		setSlash(null)
	})

	const onKeyDown = useEventCallback((event: KeyboardEvent) => {
		if (!open || event.isComposing || hasModifier(event)) return
		if (event.key === 'Escape') {
			dismissedFrom.current = slash?.from ?? null
			setSlash(null)
		} else if (ACCEPT_KEYS.has(event.key)) {
			menuRef.current?.onKeyDown(new KeyboardEvent('keydown', { key: 'Enter' }))
		} else if (NAVIGATE_KEYS.has(event.key)) {
			menuRef.current?.onKeyDown(event)
		} else {
			return
		}
		event.preventDefault()
	})

	// Typing is read off the committed draft, not a native `input` listener: a
	// state update from one flushes a render before React's own `onChange`, and
	// the controlled textarea snaps back to its old value, eating the keystroke.
	// `keyup` and `click` below cover caret moves, which edit nothing.
	useEffect(sync, [draft, sync])
	// `usehooks-ts` types its ref without `| null`, though it tolerates one.
	const listenerRef = textareaRef as RefObject<HTMLTextAreaElement>
	useEventListener('keydown', onKeyDown, listenerRef)
	useEventListener('keyup', sync, listenerRef)
	useEventListener('click', sync, listenerRef)
	useEventListener('blur', () => setSlash(null), listenerRef)
	useEventListener('focus', sync, listenerRef)

	// After the mirror has rendered the `/`, so its rect is where the caret is.
	useLayoutEffect(() => {
		const overlay = overlayRef.current
		const wrapper = wrapperRef.current
		const rect = open && slash && overlay && textOffsetRect(overlay, slash.from)
		if (!rect || !wrapper) {
			setAnchor(null)
			return
		}
		const origin = wrapper.getBoundingClientRect()
		setAnchor({ top: rect.bottom - origin.top, left: rect.left - origin.left })
	}, [open, slash, draft, overlayRef, wrapperRef])

	return { menuRef, items, anchor: open ? anchor : null, select }
}
