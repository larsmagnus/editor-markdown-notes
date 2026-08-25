import type { NodeViewProps } from '@tiptap/react'
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'
import { Code } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { ButtonAction } from '@/components/button-action'
import { ButtonCopy } from '@/components/button-copy'
import { focusBlockContentStart } from '@/editor/extensions/focus-block-content-start'
import { ButtonDelete } from '@/editor/extensions/frontmatter/button-delete'
import {
	frontmatterYaml,
	parseFrontmatterFence,
} from '@/editor/extensions/frontmatter/frontmatter-fence'
import { selectionTouchesNode } from '@/hooks/selection-touches-node'
import { useCaretInside } from '@/hooks/use-caret-inside'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { cn } from '@/lib/utils'

/**
 * The node view every `frontmatter` block renders through.
 *
 * A bordered box with a small header bar, mirroring the old standalone panel's
 * look - the difference is this now sits inside the document itself, so typing,
 * undo/redo and syntax highlighting are the same machinery the rest of the doc
 * uses, not a parallel implementation.
 *
 * Unlike every other construct's reveal (mermaid included), entering raw
 * source mode here is deliberately **not** caret-driven: the key/value view
 * is the point of having a syntax-highlighted frontmatter block at all, and
 * placing the caret inside *existing* frontmatter to edit a value must not
 * kick the user into raw `---` markup. Only the "Edit source" button opens
 * the raw fence-included view for that case (`isEditing`, local state,
 * mirroring `mermaid/block.tsx`'s rendered/source swap rather than its
 * caret-driven trigger). The one exception is a block that's already being
 * typed into the moment this view mounts - `button-add.tsx`'s "Add
 * frontmatter" and a manually-typed `---` fence (`detect.ts`) both focus
 * straight into the new node's content, and a user actively typing there
 * should not have it snap to a pretty view out from under them - so the
 * initial state is read once, synchronously, from where the caret already
 * is. Leaving *is* caret-driven (`useCaretInside`) once already editing,
 * matching every other "click away to finish" pattern in the app - except
 * while the fences are malformed, when leaving would silently drop back to a
 * pretty view over broken markdown; the raw view stays open with an error
 * until fixed.
 */
export function FrontmatterView({ node, editor, getPos }: NodeViewProps) {
	const [editingRequested, setEditingRequested] = useState(() => {
		const pos = typeof getPos === 'function' ? getPos() : undefined
		return (
			pos !== undefined && editor.isFocused && selectionTouchesNode(editor, pos)
		)
	})
	const caretInside = useCaretInside({ editor, getPos })
	const { hasClosingFence } = parseFrontmatterFence(node.textContent)
	const isEditing = editingRequested && (caretInside || !hasClosingFence)

	const [copied, handleCopy] = useCopyToClipboard(
		frontmatterYaml(node.textContent)
	)

	// `focusBlockContentStart` moves the caret in asynchronously (a chained
	// ProseMirror command), so the render right after clicking "Edit source"
	// can still see `caretInside: false` for a tick. Only auto-exit once the
	// caret has genuinely been inside during this edit session and then
	// leaves - not on that transient not-yet-caught-up state.
	const caretWasInside = useRef(false)
	useEffect(() => {
		if (caretInside) {
			caretWasInside.current = true
			return
		}
		if (!editingRequested || !hasClosingFence || !caretWasInside.current) {
			return
		}
		setEditingRequested(false)
		caretWasInside.current = false
	}, [caretInside, editingRequested, hasClosingFence])

	function handleEditSource() {
		setEditingRequested(true)
		focusBlockContentStart(editor, getPos)
	}

	return (
		<NodeViewWrapper
			data-type="frontmatter"
			className="not-prose relative mb-3 rounded-md border bg-muted/50 focus-within:ring-2"
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

			{!isEditing ? (
				<pre
					data-testid="frontmatter-rendered"
					contentEditable={false}
					className="w-full min-h-9 rounded-b-md px-2.5 py-2 m-0 font-mono text-sm whitespace-pre-wrap text-muted-foreground"
				>
					{frontmatterYaml(node.textContent)}
				</pre>
			) : null}

			{!hasClosingFence ? (
				<p
					role="alert"
					contentEditable={false}
					className="px-2.5 pb-1.5 text-xs text-red-600 dark:text-red-400"
				>
					Needs a closing --- fence
				</p>
			) : null}

			{/* Always mounted so ProseMirror can map positions into it - collapsed
			    out of the layout, not `display: none`, so it stays measurable. */}
			<NodeViewContent<'pre'>
				as="pre"
				className={cn(
					'w-full min-h-9 rounded-b-md px-2.5 py-2 m-0 font-mono text-sm text-muted-foreground whitespace-pre-wrap outline-none',
					!isEditing && 'absolute h-0 w-0 overflow-hidden'
				)}
			/>
		</NodeViewWrapper>
	)
}
