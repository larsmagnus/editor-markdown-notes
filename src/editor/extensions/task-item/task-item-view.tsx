import type { NodeViewProps } from '@tiptap/react'
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'

import { Checkbox } from '@/components/ui/checkbox'
import { createToggleTaskCheckedCommand } from '@/editor/extensions/task-item/toggle-task-checked-command'

/**
 * Renders a task list item's checkbox with the shadcn `Checkbox` in place of
 * TipTap's default native `<input type="checkbox">`, so it matches the rest of
 * the app's form controls. Stepping aside while the item's own `- [ ] ` marker
 * is revealed is `globals.css`'s job, off the decoration the reveal plugin
 * puts on the item - the same one that drops a plain list item's bullet.
 */
export function TaskItemView({ node, editor, getPos }: NodeViewProps) {
	const checked = Boolean(node.attrs.checked)

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
			<label contentEditable={false}>
				<Checkbox checked={checked} onCheckedChange={handleCheckedChange} />
			</label>
			<NodeViewContent as="div" />
		</NodeViewWrapper>
	)
}
