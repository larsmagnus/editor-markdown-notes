import type { EditorContentProps } from '@tiptap/react'
import { EditorConsumer, EditorContent } from '@tiptap/react'
import type { ReactNode } from 'react'

import { TableControls } from '@/editor/extensions/table/controls'
import type { CodeBlockStyle } from '@/hooks/use-syntax-highlight'
import { cn } from '@/lib/utils'

type EditorSurfaceProps = Omit<EditorContentProps, 'editor'> & {
	includeProseBaseClassNames?: boolean
	/**
	 * Rendered beside the document; omitted entirely when the tools are off.
	 *
	 * Must not suspend. A boundary here would sit above `EditorContent`, and
	 * unwinding to it re-renders the editor, whose mount `flushSync`s straight
	 * back into the render that suspended — see `text-tools-aside.tsx`.
	 */
	panel?: ReactNode
	/** The resolved Shiki theme's colors; undefined until one has loaded. */
	codeBlockStyle?: CodeBlockStyle
}

/**
 * The document itself, with the text tools panel alongside it.
 *
 * Reads the editor off `EditorContext` rather than taking it as a prop, so the
 * panel beside it can do the same.
 *
 * `codeBlockStyle` is custom properties rather than a class, so hanging it on
 * this container is all every `pre` below it needs.
 */
export function EditorSurface({
	includeProseBaseClassNames,
	panel,
	className,
	codeBlockStyle,
	...rest
}: EditorSurfaceProps) {
	return (
		<div className="flex flex-1 items-start gap-4" style={codeBlockStyle}>
			{/* The table handles are positioned against this box, so they measure
			    the document column rather than the viewport. self-stretch (not
			    the row's default items-start) makes it fill the row's full
			    height instead of collapsing to the document's own content
			    height, so the whole column is a click target - not just the
			    text. The sticky text-tools panel stays top-aligned. */}
			<div className="relative min-w-0 flex-1 self-stretch">
				<EditorConsumer>
					{({ editor }) => (
						<EditorContent
							editor={editor}
							spellCheck={false}
							className={cn(
								includeProseBaseClassNames &&
									'prose dark:prose-invert prose-headings:font-bold prose-headings:text-black dark:prose-headings:text-white',
								'prose-code:before:content-none prose-code:after:content-none',
								'prose-headings:first:mt-0 prose-p:first:mt-0',
								className
							)}
							{...rest}
						/>
					)}
				</EditorConsumer>
				<TableControls />
			</div>

			{panel}
		</div>
	)
}
