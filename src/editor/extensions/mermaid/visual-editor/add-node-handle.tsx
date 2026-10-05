import { Plus } from 'lucide-react'

import { Button } from '#src/components/ui/button'
import type { NodeAnchor } from '#src/hooks/use-selected-node-anchor'

type AddNodeHandleProps = {
	anchor: NodeAnchor
	onClick: () => void
}

/** The control floating beside a selected node that grows the diagram from it. */
export function AddNodeHandle({ anchor, onClick }: AddNodeHandleProps) {
	return (
		<Button
			type="button"
			variant="outline"
			size="icon-sm"
			aria-label="Add connected node"
			className="absolute z-10 -translate-y-1/2 rounded-full"
			// A gap, not a touching edge, or the node's own hover chrome fights it.
			style={{ left: anchor.left + 8, top: anchor.top }}
			onClick={onClick}
		>
			<Plus />
		</Button>
	)
}
