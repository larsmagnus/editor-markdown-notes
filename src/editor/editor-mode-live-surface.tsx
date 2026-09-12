import type { EditorContentProps } from '@tiptap/react'
import { EditorConsumer, EditorContent } from '@tiptap/react'
import { cn } from 'cn'

import { TableControls } from '#src/editor/extensions/table/controls'
import type { CodeBlockStyle } from '#src/hooks/use-syntax-highlight'

/**
 * Where the "Skip to editor" link focuses in live mode. Applied via
 * `useMarkdownEditor`'s `editorProps.attributes`, not as a prop on
 * `<EditorContent>` here: TipTap's `PureEditorContent` renders its own
 * wrapper `<div>` and appends `editor.view.dom` inside it as a child, so an
 * `id` passed to `<EditorContent>` lands on that wrapper, not the real
 * `role="textbox"` element.
 */
export const LIVE_EDITOR_ID = 'live-editor'

/** The escape-hatch hint's `aria-describedby` target - the `<p>` below. */
export const EDITOR_KEYBOARD_HINT_ID = 'editor-keyboard-hint'

type EditorSurfaceProps = Omit<EditorContentProps, 'editor'> & {
	includeTypesetClassNames?: boolean
	/** The resolved Shiki theme's colors; undefined until one has loaded. */
	codeBlockStyle?: CodeBlockStyle
}

/**
 * The rendered document itself.
 *
 * Reads the editor off `EditorContext` rather than taking it as a prop.
 *
 * `codeBlockStyle` is custom properties rather than a class, so hanging it on
 * this container is all every `pre` below it needs. `relative` is what
 * `TableControls`' `absolute inset-0` measures against - it only needs to be
 * *some* positioned ancestor wrapping the document, not necessarily this
 * component's own root, so `EditorBody` owning the surrounding row (doc
 * column + text-tools aside) doesn't disturb it.
 */
export function EditorSurface({
	includeTypesetClassNames,
	className,
	codeBlockStyle,
	...rest
}: EditorSurfaceProps) {
	return (
		<div className="relative min-w-xs" style={codeBlockStyle}>
			<p id={EDITOR_KEYBOARD_HINT_ID} className="sr-only">
				Press Escape, then Tab, to move keyboard focus out of the document text.
			</p>
			<EditorConsumer>
				{({ editor }) => (
					<EditorContent
						editor={editor}
						className={cn(
							includeTypesetClassNames && 'typeset typeset-note',
							className
						)}
						{...rest}
					/>
				)}
			</EditorConsumer>
			<TableControls />
		</div>
	)
}
