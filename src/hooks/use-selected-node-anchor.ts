import type { RefObject } from 'react'
import { useEffect, useState } from 'react'

export type NodeAnchor = { left: number; top: number }

/** A position, and the node it was measured for. */
type MeasuredAnchor = NodeAnchor & { nodeId: string }

type SelectedNodeAnchorOptions = {
	/** The element visimer draws the diagram in. */
	canvasRef: RefObject<HTMLElement | null>
	/** The element the returned position is relative to. */
	frameRef: RefObject<HTMLElement | null>
	/** The selected node's entity id, if exactly one node is selected. */
	nodeId: string | undefined
}

/**
 * Where to put a control beside the selected node, following it through pan,
 * zoom and re-render - none of which visimer reports.
 *
 * Goes `undefined` the moment the node's element is gone, whatever the
 * selection still claims: a control left beside nothing invites a click that
 * cannot do anything.
 */
export function useSelectedNodeAnchor({
	canvasRef,
	frameRef,
	nodeId,
}: SelectedNodeAnchorOptions): NodeAnchor | undefined {
	const [measured, setMeasured] = useState<MeasuredAnchor>()

	useEffect(() => {
		if (!nodeId) return

		let frameId = 0

		function follow() {
			const node = canvasRef.current?.querySelector(
				`[data-mw-entity="${CSS.escape(nodeId ?? '')}"]`
			)
			const frame = frameRef.current?.getBoundingClientRect()

			if (!node || !frame) {
				setMeasured(undefined)
			} else {
				const rect = node.getBoundingClientRect()
				const next = {
					nodeId: nodeId ?? '',
					left: Math.round(rect.right - frame.left),
					top: Math.round(rect.top - frame.top + rect.height / 2),
				}
				setMeasured((previous) =>
					previous?.nodeId === next.nodeId &&
					previous.left === next.left &&
					previous.top === next.top
						? previous
						: next
				)
			}

			frameId = requestAnimationFrame(follow)
		}

		frameId = requestAnimationFrame(follow)
		return () => cancelAnimationFrame(frameId)
	}, [canvasRef, frameRef, nodeId])

	// A position measured for another node is not this node's, however briefly.
	if (!measured || measured.nodeId !== nodeId) return undefined

	return { left: measured.left, top: measured.top }
}
