import type { NodeViewProps } from '@tiptap/react'
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'
import { Code } from 'lucide-react'

import { ButtonAction } from '@/components/button-action'
import { ButtonCopy } from '@/components/button-copy'
import { ErrorFallback } from '@/components/error-fallback'
import { focusBlockContentStart } from '@/editor/extensions/focus-block-content-start'
import { ButtonDelete } from '@/editor/extensions/frontmatter/button-delete'
import {
	frontmatterYaml,
	parseFrontmatterFence,
} from '@/editor/extensions/frontmatter/frontmatter-fence'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'

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

	function handleEditSource() {
		focusBlockContentStart(editor, getPos)
	}

	return (
		<NodeViewWrapper
			data-type="frontmatter"
			className="not-typeset relative mb-3 rounded-md border bg-muted/50 focus-within:ring-2"
		>
			<div
				className="flex items-center justify-between border-b px-3 py-1.5"
				contentEditable={false}
			>
				<span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
					Frontmatter
				</span>
				<div className="flex items-center gap-1">
					<ButtonAction
						icon={<Code />}
						label="Edit frontmatter source"
						tooltip="Edit source"
						onClick={handleEditSource}
					/>
					<ButtonCopy
						copied={copied}
						label="Copy frontmatter"
						onClick={handleCopy}
					/>
					<ButtonDelete editor={editor} getPos={getPos} />
				</div>
			</div>

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
