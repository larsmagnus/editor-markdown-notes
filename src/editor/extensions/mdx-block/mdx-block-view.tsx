import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'

/**
 * The node view every `mdxBlock` renders through: a bordered, monospace box
 * labelled "MDX" - signalling this is raw source the live editor won't
 * render, not prose - wrapped around the block's own editable content.
 */
export function MdxBlockView() {
	return (
		<NodeViewWrapper
			data-type="mdx-block"
			className="not-typeset relative my-3 rounded-md border bg-muted/50 focus-within:ring-2"
		>
			<div
				className="flex items-center border-b px-3 py-1.5"
				contentEditable={false}
			>
				<span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
					MDX
				</span>
			</div>
			<NodeViewContent<'pre'>
				as="pre"
				data-testid="mdx-block-rendered"
				className="w-full min-h-9 rounded-b-md px-2.5 py-2 m-0 font-mono text-sm text-muted-foreground whitespace-pre-wrap outline-none"
			/>
		</NodeViewWrapper>
	)
}
