'use client'

import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'

import type { SlashCommandItem } from '@/editor/extensions/slash-command/commands'
import { cn } from '@/lib/utils'

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

	// The list re-filters on every keystroke of the query; the highlight
	// should not point at whatever index used to be there.
	useEffect(() => {
		setSelectedIndex(0)
	}, [items])

	useImperativeHandle(
		ref,
		() => ({
			onKeyDown: (event) => {
				if (items.length === 0) return false

				if (event.key === 'ArrowDown') {
					setSelectedIndex((index) => (index + 1) % items.length)
					return true
				}

				if (event.key === 'ArrowUp') {
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
			className="w-56 rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10"
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
						onMouseEnter={() => setSelectedIndex(index)}
					>
						<item.icon className="size-4" />
						{item.label}
					</button>
				</li>
			))}
		</ul>
	)
})
