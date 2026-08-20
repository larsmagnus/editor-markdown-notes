import type { Editor } from '@tiptap/react'
import { useEditorState } from '@tiptap/react'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'

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
		editor.chain().insertContentAt(0, { type: 'frontmatter' }).focus(1).run()
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
