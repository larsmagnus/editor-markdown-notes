import type { NodeViewProps } from '@tiptap/react'
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'

import { Checkbox } from '@/components/ui/checkbox'

/**
 * Renders a task list item's checkbox with the shadcn `Checkbox` in place of
 * TipTap's default native `<input type="checkbox">`, so it matches the rest
 * of the app's form controls.
 */
export function TaskItemView({ node, updateAttributes }: NodeViewProps) {
	const checked = Boolean(node.attrs.checked)

	const handleCheckedChange = (value: boolean) => {
		updateAttributes({ checked: value })
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
