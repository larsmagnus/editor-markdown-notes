import type { EditorContentProps } from '@tiptap/react'
import { EditorConsumer, EditorContent } from '@tiptap/react'
import { Suspense } from 'react'
import type { ReactNode } from 'react'

import type { CodeBlockStyle } from '@/hooks/use-syntax-highlight'
import { cn } from '@/lib/utils'

type EditorSurfaceProps = Omit<EditorContentProps, 'editor'> & {
	includeProseBaseClassNames?: boolean
	/** Rendered beside the document; omitted entirely when the tools are off. */
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
		<div className="flex items-start gap-4" style={codeBlockStyle}>
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
							'min-w-0 flex-1',
							className
						)}
						{...rest}
					/>
				)}
			</EditorConsumer>

			{panel && <Suspense fallback={null}>{panel}</Suspense>}
		</div>
	)
}
