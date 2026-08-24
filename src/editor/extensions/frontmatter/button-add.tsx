import type { Editor } from '@tiptap/react'
import { useEditorState } from '@tiptap/react'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { parseFrontmatterFence } from '@/editor/extensions/frontmatter/frontmatter-fence'

type ButtonAddProps = { editor: Editor }

/**
 * Inserts an empty frontmatter block at the top of the document.
 *
 * Only shown when the doc doesn't already have one - reads that off
 * `useEditorState` rather than `editor.state.doc` directly, the same reason
 * `BubbleMenuContent` does for `isActive('image')`: `useEditor`'s default
 * options don't re-render on transactions, so a direct read would go stale
 * after the very first edit.
 */
export function ButtonAdd({ editor }: ButtonAddProps) {
	const hasFrontmatter = useEditorState({
		editor,
		selector: ({ editor }) =>
			editor?.state.doc.firstChild?.type.name === 'frontmatter',
	})

	if (hasFrontmatter) return null

	function handleClick() {
		// A blank line between the fences, not `frontmatterFenceText('')` (which
		// collapses to `---\n---`, no gap) - that builder exists to round-trip an
		// already-empty block byte-for-byte, but here the author is about to
		// type, and typing right where its two fence lines touch would run
		// straight into the closing one.
		const text = '---\n\n---'

		editor
			.chain()
			.insertContentAt(0, {
				type: 'frontmatter',
				content: [{ type: 'text', text }],
			})
			// `insertContentAt(0, ...)` puts the node's own start at document
			// position 0, so content starts at 1 - plus the fence's own parse
			// (not hand-counted) for how far past that the blank line sits.
			.focus(1 + parseFrontmatterFence(text).codeFrom)
			.run()
	}

	return (
		<div className="mb-3">
			<Button
				type="button"
				variant="outline"
				size="sm"
				className="text-muted-foreground"
				onClick={handleClick}
			>
				<Plus /> Add frontmatter
			</Button>
		</div>
	)
}
