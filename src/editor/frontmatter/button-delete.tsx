import type { Editor } from '@tiptap/react'
import { Trash2 } from 'lucide-react'

import { ButtonNodeAction } from '@/editor/button-node-action'

type ButtonDeleteProps = {
	editor: Editor
	/** The node view's own position getter - the click may not have moved the
	 *  selection into the block first, so `deleteNode` (which walks up from the
	 *  current selection) can't be relied on to find it. */
	getPos: () => number | undefined
}

/**
 * Removes the frontmatter block when clicked.
 *
 * No confirmation dialog: the block lives inside the same document as
 * everything else now, so deleting it is a normal, undoable transaction -
 * Ctrl+Z restores it exactly like deleting any other block would.
 */
export function ButtonDelete({ editor, getPos }: ButtonDeleteProps) {
	function handleClick() {
		const pos = getPos()
		if (pos === undefined) return

		const node = editor.state.doc.nodeAt(pos)
		if (!node) return

		editor
			.chain()
			.focus()
			.deleteRange({ from: pos, to: pos + node.nodeSize })
			.run()
	}

	return (
		<ButtonNodeAction
			icon={<Trash2 />}
			label="Delete frontmatter"
			tooltip="Delete"
			onClick={handleClick}
		/>
	)
}
