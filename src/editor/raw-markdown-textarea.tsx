import { cn } from 'cn'
import type { ChangeEventHandler, FocusEventHandler, Ref } from 'react'

import { RAW_TEXT_LAYOUT } from '#src/editor/raw-text-layout'

/** Where the "Skip to editor" link (`skip-target.ts`) focuses in raw mode. */
export const RAW_MARKDOWN_EDITOR_ID = 'raw-markdown-editor'

interface RawMarkdownTextareaProps {
	value: string
	onChange: ChangeEventHandler<HTMLTextAreaElement>
	onBlur: FocusEventHandler<HTMLTextAreaElement>
	/** Draws the text itself, for when the mirror behind it no longer lines up (`useMirrorAlignment`). */
	textVisible: boolean
	/** The mouse is over a link's href with the modifier held (`useRawLinkHover`). */
	overLink: boolean
	ref?: Ref<HTMLTextAreaElement>
}

/**
 * Raw mode's editable text.
 *
 * `pre-wrap` rather than `pre`: the source shares the rendered document's
 * measure, so a line longer than it has to wrap rather than run off the side
 * of a column it cannot scroll.
 *
 * Text itself is transparent - `RawMarkdownHighlight` behind it carries the
 * actual colored glyphs - but the caret stays the theme's foreground color so
 * it doesn't vanish along with it.
 *
 * `cursor-pointer` over a link - the textarea is what actually receives the
 * pointer, so it is the one CSS can style a cursor on.
 */
export function RawMarkdownTextarea({
	value,
	onChange,
	onBlur,
	textVisible,
	overLink,
	ref,
}: RawMarkdownTextareaProps) {
	return (
		<textarea
			id={RAW_MARKDOWN_EDITOR_ID}
			ref={ref}
			value={value}
			onChange={onChange}
			onBlur={onBlur}
			spellCheck={false}
			aria-label="Raw markdown"
			className={cn(
				RAW_TEXT_LAYOUT,
				'relative w-full resize-none bg-transparent caret-brand outline-none field-sizing-content',
				textVisible ? 'text-foreground' : 'text-transparent',
				overLink && 'cursor-pointer'
			)}
		/>
	)
}
