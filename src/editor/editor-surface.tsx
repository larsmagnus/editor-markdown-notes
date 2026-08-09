import type { EditorContentProps } from '@tiptap/react'
import { EditorConsumer, EditorContent } from '@tiptap/react'
import { Suspense } from 'react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type EditorSurfaceProps = Omit<EditorContentProps, 'editor'> & {
	includeProseBaseClassNames?: boolean
	/** Rendered beside the document; omitted entirely when the tools are off. */
	panel?: ReactNode
}

/**
 * The document itself, with the text tools panel alongside it.
 *
 * Reads the editor off `EditorContext` rather than taking it as a prop, so the
 * panel beside it can do the same.
 */
export function EditorSurface({
	includeProseBaseClassNames,
	panel,
	className,
	...rest
}: EditorSurfaceProps) {
	return (
		<div className="flex items-start gap-4">
			<EditorConsumer>
				{({ editor }) => (
					<EditorContent
						editor={editor}
						spellCheck={false}
						className={cn(
							includeProseBaseClassNames &&
								'prose dark:prose-invert prose-headings:font-bold prose-headings:text-black dark:prose-headings:text-white',
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
