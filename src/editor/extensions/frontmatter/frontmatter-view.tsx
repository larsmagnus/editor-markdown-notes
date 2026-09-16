import type { NodeViewProps } from '@tiptap/react'
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'
import { cn } from 'cn'

import { ErrorFallback } from '#src/components/error-fallback'
import { frontmatterMarkerSpec } from '#src/editor/extensions/block-marker/fenced-specs'
import { focusBlockContentStart } from '#src/editor/extensions/focus-block-content-start'
import {
	frontmatterYaml,
	parseFrontmatterFence,
} from '#src/editor/extensions/frontmatter/frontmatter-fence'
import { FrontmatterHeader } from '#src/editor/extensions/frontmatter/frontmatter-header'
import { useCopyToClipboard } from '#src/hooks/use-copy-to-clipboard'
import { useMarkerRevealed } from '#src/hooks/use-marker-revealed'

/**
 * The node view every `frontmatter` block renders through: a bordered box with
 * a header bar, wrapped around the block's own editable content.
 *
 * The content is rendered directly rather than mirrored into a read-only
 * pretty view. A mirror cannot carry decorations - Shiki's YAML highlighting
 * is drawn over the real text - and a `contenteditable="false"` copy loses its
 * line breaks entirely, since the editor's own stylesheet resets `white-space`
 * on non-editable content and outranks a utility class. Hiding the `---`
 * fences is `SyntaxReveal`'s job here exactly as it is for a code block
 * (`extensions.ts` registers the provider), so the fences appear only while
 * the caret is inside, and "Edit source" just moves the caret there.
 */
export function FrontmatterView({ node, editor, getPos }: NodeViewProps) {
	const { hasClosingFence } = parseFrontmatterFence(node.textContent)
	const [copied, handleCopy] = useCopyToClipboard(
		frontmatterYaml(node.textContent)
	)
	const revealed = useMarkerRevealed({
		editor,
		getPos,
		node,
		spec: frontmatterMarkerSpec,
		markerLength: 0,
	})

	function handleEditSource() {
		focusBlockContentStart(editor, getPos)
	}

	return (
		<NodeViewWrapper
			data-type="frontmatter"
			className={cn(
				'not-typeset relative mb-3 rounded-md border bg-muted/50 focus-within:ring-2',
				revealed && 'ring-2 ring-primary/30'
			)}
		>
			<FrontmatterHeader
				editor={editor}
				getPos={getPos}
				copied={copied}
				onCopy={handleCopy}
				onEditSource={handleEditSource}
			/>

			{!hasClosingFence ? (
				<ErrorFallback title="Needs a closing --- fence" className="m-2" />
			) : null}

			<NodeViewContent<'pre'>
				as="pre"
				data-testid="frontmatter-rendered"
				className="w-full min-h-9 rounded-b-md px-2.5 py-2 m-0 font-mono text-sm text-muted-foreground whitespace-pre-wrap outline-none"
			/>
		</NodeViewWrapper>
	)
}
