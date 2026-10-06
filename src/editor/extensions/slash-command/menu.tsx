import { cn } from 'cn'
import {
	forwardRef,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from 'react'
import type { MouseEvent } from 'react'

import type { SlashCommandItem } from '#src/editor/extensions/slash-command/commands'

/** What `extension.ts` drives keyboard navigation through, outside React's own event system. */
export type SlashCommandMenuHandle = {
	/** Returns whether the key was handled, so `Suggestion` knows to swallow it. */
	onKeyDown: (event: KeyboardEvent) => boolean
}

interface SlashCommandMenuProps {
	items: SlashCommandItem[]
	onSelect: (item: SlashCommandItem) => void
}

/**
 * The slash command dropdown's list.
 *
 * Kept apart from `extension.ts`'s `Suggestion`/tippy wiring so it is
 * unit-testable on its own - the same split `bubble-menu-content.tsx` uses
 * relative to `menu-bubble.tsx`. Exposes `onKeyDown` through a ref because
 * `Suggestion`'s `render()` lifecycle drives keyboard navigation
 * imperatively, ahead of anything reaching this component as props.
 */
export const SlashCommandMenu = forwardRef<
	SlashCommandMenuHandle,
	SlashCommandMenuProps
>(function SlashCommandMenu({ items, onSelect }, ref) {
	const [selectedIndex, setSelectedIndex] = useState(0)
	const listRef = useRef<HTMLUListElement>(null)
	// Only arrow keys bring the highlight into view: under the mouse it is
	// already visible, and scrolling there would move the list out from under it.
	const highlightMovedByKey = useRef(false)

	useEffect(() => {
		if (!highlightMovedByKey.current) return
		listRef.current?.children[selectedIndex]?.scrollIntoView({
			block: 'nearest',
		})
	}, [selectedIndex])

	// The list re-filters on every keystroke of the query; the highlight
	// should not point at whatever index used to be there.
	const [highlightedItems, setHighlightedItems] = useState(items)
	if (highlightedItems !== items) {
		setHighlightedItems(items)
		setSelectedIndex(0)
	}

	// A click must not move focus off the editor: the live menu closes once the
	// editor blurs, before the click lands, and the raw menu needs its caret.
	const keepEditorFocus = (event: MouseEvent) => event.preventDefault()

	const highlightFromMouse = (index: number) => {
		highlightMovedByKey.current = false
		setSelectedIndex(index)
	}

	useImperativeHandle(
		ref,
		() => ({
			onKeyDown: (event) => {
				if (items.length === 0) return false

				if (event.key === 'ArrowDown') {
					highlightMovedByKey.current = true
					setSelectedIndex((index) => (index + 1) % items.length)
					return true
				}

				if (event.key === 'ArrowUp') {
					highlightMovedByKey.current = true
					setSelectedIndex((index) => (index + items.length - 1) % items.length)
					return true
				}

				if (event.key === 'Enter') {
					const item = items[selectedIndex]
					if (item) onSelect(item)
					return true
				}

				return false
			},
		}),
		[items, selectedIndex, onSelect]
	)

	if (items.length === 0) {
		return (
			<div className="w-56 rounded-lg bg-popover p-2 text-sm text-muted-foreground shadow-md ring-1 ring-foreground/10">
				No results
			</div>
		)
	}

	return (
		<ul
			ref={listRef}
			onMouseDown={keepEditorFocus}
			className="max-h-64 w-56 overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10"
			role="listbox"
		>
			{items.map((item, index) => (
				<li key={item.id}>
					<button
						type="button"
						role="option"
						aria-selected={index === selectedIndex}
						className={cn(
							'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm',
							index === selectedIndex && 'bg-accent text-accent-foreground'
						)}
						onClick={() => onSelect(item)}
						onMouseEnter={() => highlightFromMouse(index)}
					>
						<item.icon className="size-4" />
						{item.label}
					</button>
				</li>
			))}
		</ul>
	)
})
