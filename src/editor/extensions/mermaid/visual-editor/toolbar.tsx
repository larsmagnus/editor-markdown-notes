import { Spline, SquarePlus, Trash2 } from 'lucide-react'

import { ButtonAction } from '#src/components/button-action'
import { OverlayToolbar } from '#src/components/overlay-toolbar'
import { Button } from '#src/components/ui/button'
import { ZoomButtons } from '#src/editor/extensions/mermaid/visual-editor/zoom-buttons'

type VisualEditorToolbarProps = {
	connecting: boolean
	canDelete: boolean
	onDone: () => void
	onAddNode: () => void
	onToggleConnect: () => void
	onDelete: () => void
	onZoom: (factor: number) => void
	onFit: () => void
}

/**
 * The controls over the visual editor, laid out like the diagram's own toolbar
 * so entering and leaving the editor does not move anything the eye was on.
 */
export function VisualEditorToolbar({
	connecting,
	canDelete,
	onDone,
	onAddNode,
	onToggleConnect,
	onDelete,
	onZoom,
	onFit,
}: VisualEditorToolbarProps) {
	const connectLabel = connecting ? 'Stop connecting' : 'Connect nodes'

	return (
		<OverlayToolbar visible>
			<Button type="button" variant="ghost" size="sm" onClick={onDone}>
				Done editing
			</Button>
			<ButtonAction
				icon={<SquarePlus />}
				label="Add node"
				onClick={onAddNode}
			/>
			<ButtonAction
				icon={<Spline />}
				label={connectLabel}
				className={connecting ? 'bg-muted' : undefined}
				onClick={onToggleConnect}
			/>
			<ButtonAction
				icon={<Trash2 />}
				label="Delete selection"
				disabled={!canDelete}
				onClick={onDelete}
			/>
			<ZoomButtons onZoom={onZoom} onFit={onFit} />
		</OverlayToolbar>
	)
}
