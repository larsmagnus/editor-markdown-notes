import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

import { forEachMarkerHost } from '@/editor/extensions/block-marker/marker-host'
import type { MarkerMatch } from '@/editor/extensions/block-marker/marker-host'
import type { BlockMarkerSpec } from '@/editor/extensions/block-marker/spec'
import type { DeletionProbe } from '@/editor/extensions/syntax-repair/authored-deletion'

/** One marker to write, and where whatever is currently there begins and ends. */
export type MarkerFix = {
	host: ProseMirrorNode
	nodeStart: number
	textStart: number
	existingLength: number
	marker: string
	/** Written at the host's very end, for a construct that closes itself. */
	trailing?: string
}

/**
 * What one construct needs: its marker written, or - its author having just
 * deleted that marker - the construct itself taken apart.
 */
export type MarkerAction =
	| { kind: 'fix'; fix: MarkerFix }
	| { kind: 'unwrap'; spec: BlockMarkerSpec; match: MarkerMatch }

/**
 * Where a construct whose marker the author just deleted now sits, by its
 * position in the new document. Everything else missing a marker never had
 * one - a construct fresh from an input rule, a paste, `splitListItem` or a
 * toolbar toggle - and gets one written for it instead.
 */
function findAuthoredRemovals(
	oldDoc: ProseMirrorNode,
	specs: BlockMarkerSpec[],
	probe: DeletionProbe
): Set<number> {
	const removed = new Set<number>()

	forEachMarkerHost(oldDoc, specs, ({ spec, host, pos }) => {
		const length = spec.length(host.node.textContent)
		if (length === 0) return
		if (!probe.deleted(host.textStart, host.textStart + length)) return

		removed.add(probe.forward(pos, -1))
	})

	return removed
}

/**
 * Every construct in `newDoc` whose marker is absent, wrong or stale, in
 * document order - each paired with what to do about it.
 */
export function findMarkerActions(
	oldDoc: ProseMirrorNode,
	newDoc: ProseMirrorNode,
	specs: BlockMarkerSpec[],
	probe: DeletionProbe
): MarkerAction[] {
	const removed = findAuthoredRemovals(oldDoc, specs, probe)
	const actions: MarkerAction[] = []

	forEachMarkerHost(newDoc, specs, (match) => {
		const { spec, host, node, parent, index, pos } = match
		const text = host.node.textContent
		const existingLength = spec.length(text)

		if (existingLength === 0 && removed.has(pos)) {
			actions.push({ kind: 'unwrap', spec, match })
			return
		}

		const context = { node, parent, index, text }
		const marker = spec.resolve(context)
		const trailing =
			spec.trailingLength?.(text) === 0
				? spec.resolveTrailing?.(context)
				: undefined

		if (marker === text.slice(0, existingLength) && trailing === undefined) {
			return
		}

		actions.push({
			kind: 'fix',
			fix: {
				host: host.node,
				nodeStart: host.nodeStart,
				textStart: host.textStart,
				existingLength,
				marker,
				trailing,
			},
		})
	})

	return actions
}
