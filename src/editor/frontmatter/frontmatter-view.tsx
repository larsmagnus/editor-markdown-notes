import type { NodeViewProps } from '@tiptap/react'
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'

import { ButtonCopy } from '@/editor/button-copy'
import { ButtonDelete } from '@/editor/frontmatter/button-delete'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'

/**
 * The node view every `frontmatter` block renders through.
 *
 * A bordered box with a small header bar, mirroring the old standalone panel's
 * look - the difference is this now sits inside the document itself, so typing,
 * undo/redo and syntax highlighting are the same machinery the rest of the doc
 * uses, not a parallel implementation.
 */
export function FrontmatterView({ node, editor, getPos }: NodeViewProps) {
	const [copied, handleCopy] = useCopyToClipboard(node.textContent)

	return (
		<NodeViewWrapper
			data-type="frontmatter"
			className="not-prose mb-3 rounded-md border bg-muted/50 focus-within:ring-2"
		>
			<div
				className="flex items-center justify-between border-b px-3 py-1.5"
				contentEditable={false}
			>
				<span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
					Frontmatter
				</span>
				<div className="flex items-center gap-1">
					<ButtonCopy
						copied={copied}
						label="Copy frontmatter"
						onClick={handleCopy}
					/>
					<ButtonDelete editor={editor} getPos={getPos} />
				</div>
			</div>
			<NodeViewContent<'pre'>
				as="pre"
				className="w-full min-h-9 rounded-b-md px-2.5 py-2 m-0 font-mono text-sm text-muted-foreground whitespace-pre-wrap outline-none"
			/>
		</NodeViewWrapper>
	)
}
