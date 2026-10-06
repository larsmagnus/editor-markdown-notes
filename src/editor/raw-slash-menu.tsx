import type { RefObject } from 'react'

import { SlashCommandMenu } from '#src/editor/extensions/slash-command/menu'
import { useRawSlashMenu } from '#src/hooks/use-raw-slash-menu'

interface RawSlashMenuProps {
	textareaRef: RefObject<HTMLTextAreaElement | null>
	overlayRef: RefObject<HTMLPreElement | null>
	wrapperRef: RefObject<HTMLDivElement | null>
	draft: string
	active: boolean
}

/**
 * Raw mode's slash menu, placed under the `/` that opened it inside the
 * editor's own wrapper so it scrolls with the text.
 */
export function RawSlashMenu({
	textareaRef,
	overlayRef,
	wrapperRef,
	draft,
	active,
}: RawSlashMenuProps) {
	const { menuRef, items, anchor, select } = useRawSlashMenu(
		textareaRef,
		overlayRef,
		wrapperRef,
		draft,
		active
	)

	if (!anchor) return null

	return (
		<div
			className="absolute z-10"
			style={{ top: anchor.top, left: anchor.left }}
		>
			<SlashCommandMenu ref={menuRef} items={items} onSelect={select} />
		</div>
	)
}
