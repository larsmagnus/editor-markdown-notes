import type { NodeViewProps } from '@tiptap/react'
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'

import { Checkbox } from '@/components/ui/checkbox'
import { parseListMarker } from '@/editor/extensions/list/list-marker'
import { createToggleTaskCheckedCommand } from '@/editor/extensions/task-item/toggle-task-checked-command'
import { useMarkerRevealed } from '@/hooks/use-marker-revealed'

/**
 * Renders a task list item's checkbox with the shadcn `Checkbox` in place of
 * TipTap's default native `<input type="checkbox">`, so it matches the rest
 * of the app's form controls - and steps aside while the item's own `- [ ] `
 * marker is revealed, so only ever one of the two is on screen.
 */
export function TaskItemView({ node, editor, getPos }: NodeViewProps) {
	const checked = Boolean(node.attrs.checked)
	const markerLength =
		parseListMarker(node.firstChild?.textContent ?? '')?.markerLength ?? 0
	// The checkbox stands in for the `- [ ] ` the item actually holds. While
	// that text is revealed it is on screen itself, and drawing both leaves the
	// item reading `☐ - [ ] Buy milk`.
	const markerRevealed = useMarkerRevealed({ editor, getPos, markerLength })

	const handleCheckedChange = (value: boolean) => {
		const pos = typeof getPos === 'function' ? getPos() : undefined
		if (pos === undefined) return
		// Flips the marker's own `[ ]`/`[x]` text, not just the attribute - see
		// `toggle-task-checked-command.ts` for why the text has to lead.
		createToggleTaskCheckedCommand(pos, value)(
			editor.state,
			editor.view.dispatch
		)
	}

	return (
		<NodeViewWrapper as="li" data-checked={checked} data-type="taskItem">
			{markerRevealed ? null : (
				<label contentEditable={false}>
					<Checkbox checked={checked} onCheckedChange={handleCheckedChange} />
				</label>
			)}
			<NodeViewContent as="div" />
		</NodeViewWrapper>
	)
}
