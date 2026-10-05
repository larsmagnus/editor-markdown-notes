import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useSelectedNodeAnchor } from '#src/hooks/use-selected-node-anchor'

function rectAt(left: number, top: number, size = 40) {
	return {
		left,
		top,
		right: left + size,
		bottom: top + size,
		width: size,
		height: size,
	} as DOMRect
}

function renderDiagram() {
	const frame = document.createElement('div')
	frame.getBoundingClientRect = () => rectAt(0, 0, 500)
	const canvas = document.createElement('div')
	frame.append(canvas)

	function addNode(id: string, rect: DOMRect) {
		const node = document.createElement('div')
		node.dataset.mwEntity = id
		node.getBoundingClientRect = () => rect
		canvas.append(node)
		return node
	}

	return {
		addNode,
		refs: { canvasRef: { current: canvas }, frameRef: { current: frame } },
	}
}

describe('useSelectedNodeAnchor', () => {
	it('sits beside the middle of the right edge of the selected node', async () => {
		const { addNode, refs } = renderDiagram()
		addNode('node:A', rectAt(100, 200))

		const { result } = renderHook(() =>
			useSelectedNodeAnchor({ ...refs, nodeId: 'node:A' })
		)

		await waitFor(() => expect(result.current).toEqual({ left: 140, top: 220 }))
	})

	it('has no position once the selected node is gone, whatever the selection says', async () => {
		const { addNode, refs } = renderDiagram()
		const node = addNode('node:A', rectAt(100, 200))
		const { result } = renderHook(() =>
			useSelectedNodeAnchor({ ...refs, nodeId: 'node:A' })
		)
		await waitFor(() => expect(result.current).toBeDefined())

		node.remove()

		await waitFor(() => expect(result.current).toBeUndefined())
	})

	// The frame between selecting another node and the next measurement is
	// still drawn.
	it('never offers the previous node position for a newly selected one', async () => {
		const { addNode, refs } = renderDiagram()
		addNode('node:A', rectAt(100, 200))
		addNode('node:B', rectAt(300, 50))
		const { result, rerender } = renderHook(
			({ nodeId }) => useSelectedNodeAnchor({ ...refs, nodeId }),
			{ initialProps: { nodeId: 'node:A' } }
		)
		await waitFor(() => expect(result.current).toEqual({ left: 140, top: 220 }))

		rerender({ nodeId: 'node:B' })

		expect(result.current).toBeUndefined()
		await waitFor(() => expect(result.current).toEqual({ left: 340, top: 70 }))
	})
})
