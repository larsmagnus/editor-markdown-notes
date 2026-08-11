import { useRef } from 'react'

import { TableHandle } from '@/editor/table/handle'
import { useTableAnchor } from '@/hooks/use-table-anchor'

/**
 * The floating row and column handles for the table the caret is in.
 *
 * An overlay rather than node views: the handles sit outside the table's own
 * box, and ProseMirror owns everything inside it. The layer ignores pointer
 * events so that text below it stays selectable; each handle takes them back.
 */
export function TableControls() {
	const overlayRef = useRef<HTMLDivElement>(null)
	const anchor = useTableAnchor(overlayRef)

	return (
		<div
			ref={overlayRef}
			aria-hidden={!anchor}
			className="pointer-events-none absolute inset-0 z-10"
		>
			{anchor ? (
				<>
					<TableHandle axis="column" anchor={anchor} />
					<TableHandle axis="row" anchor={anchor} />
				</>
			) : null}
		</div>
	)
}
