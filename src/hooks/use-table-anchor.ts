import { useCurrentEditor } from '@tiptap/react'
import { useEffect, useState } from 'react'
import type { RefObject } from 'react'

import { measureTableAnchor } from '@/editor/extensions/table/geometry'
import type { TableAnchor } from '@/editor/extensions/table/geometry'

/**
 * Everything about an anchor that is a number, as one comparable string.
 *
 * Written by rest rather than by listing the fields, so a measurement added to
 * `TableAnchor` later is compared without anyone having to remember to add it.
 */
function measurementsOf({ table: _table, ...rest }: TableAnchor): string {
	return JSON.stringify(rest)
}

/** Would the handles be drawn in exactly the same place for both? */
function sameAnchor(a: TableAnchor | null, b: TableAnchor | null): boolean {
	if (!a || !b) return a === b

	return a.table === b.table && measurementsOf(a) === measurementsOf(b)
}

/**
 * Keeps `measureTableAnchor` in step with the editor.
 *
 * Re-measures on every transaction rather than only on selection changes:
 * typing into a cell can widen a column and move both handles. That is every
 * keystroke, so an unchanged measurement has to keep the old object - the
 * overlay and both handles re-render on any new one.
 */
export function useTableAnchor(
	overlayRef: RefObject<HTMLElement | null>
): TableAnchor | null {
	const { editor } = useCurrentEditor()
	const [anchor, setAnchor] = useState<TableAnchor | null>(null)

	useEffect(() => {
		if (!editor) return

		const update = () =>
			setAnchor((current) => {
				const measured = measureTableAnchor(editor, overlayRef.current)

				return sameAnchor(current, measured) ? current : measured
			})

		update()
		editor.on('transaction', update)
		editor.on('selectionUpdate', update)
		window.addEventListener('resize', update)

		// Anything above the table that reflows without a transaction moves it -
		// a diagram finishing its render, an image loading - and the handles
		// would otherwise stay where the table used to be.
		const observer = new ResizeObserver(update)
		observer.observe(editor.view.dom)

		return () => {
			editor.off('transaction', update)
			editor.off('selectionUpdate', update)
			window.removeEventListener('resize', update)
			observer.disconnect()
		}
	}, [editor, overlayRef])

	return anchor
}
