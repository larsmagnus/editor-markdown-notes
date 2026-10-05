import type { NodeViewProps } from '@tiptap/react'
import type { ComponentProps } from 'react'

import { MermaidDiagram } from '#src/editor/extensions/mermaid/diagram'
import { ContainedVisualEditor } from '#src/editor/extensions/mermaid/visual-editor/contained-visual-editor'

type DiagramSlotProps = Pick<NodeViewProps, 'editor' | 'getPos'> &
	Omit<ComponentProps<typeof MermaidDiagram>, 'onEdit' | 'onEditVisually'> & {
		editingVisually: boolean
		onEditSource: () => void
		onEditVisually: () => void
		onDoneEditingVisually: () => void
	}

/** What stands in front of a mermaid block's source: its diagram, or the editor
 *  for it while that is open. */
export function DiagramSlot({
	editor,
	getPos,
	code,
	result,
	showSource,
	editingVisually,
	onEditSource,
	onEditVisually,
	onDoneEditingVisually,
}: DiagramSlotProps) {
	if (editingVisually) {
		return (
			<ContainedVisualEditor
				editor={editor}
				getPos={getPos}
				code={code}
				onDone={onDoneEditingVisually}
			/>
		)
	}

	return (
		<MermaidDiagram
			code={code}
			result={result}
			showSource={showSource}
			onEdit={onEditSource}
			onEditVisually={onEditVisually}
		/>
	)
}
