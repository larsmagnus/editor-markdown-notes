import type { MermaidWysiwygEditor, ParseResult } from '@visimer/core'

type EngineClass = typeof MermaidWysiwygEditor

type Referrer = { entityId: string; lineIndex: number }

/** What refers to the entity `id` (the part after the prefix). */
type ReferrersOf = (result: ParseResult, id: string) => Referrer[]

const NO_REFERRERS: Referrer[] = []

/**
 * For each kind of entity that can be declared on a line of its own, the
 * entities that point at it - the ones that have to go first.
 */
const REFERRERS: Record<string, ReferrersOf> = {
	'node:': ({ flowchart }, id) =>
		(flowchart?.edges ?? [])
			.filter((edge) => edge.source === id || edge.target === id)
			.map(({ entityId, lineIndex }) => ({ entityId, lineIndex })),
	'state:': ({ state }, id) =>
		(state?.transitions ?? [])
			.filter(
				(transition) => transition.source === id || transition.target === id
			)
			.map(({ entityId, lineIndex }) => ({ entityId, lineIndex })),
	'class:': ({ classGraph }, id) =>
		(classGraph?.relations ?? [])
			.filter((relation) => relation.source === id || relation.target === id)
			.map(({ entityId, lineIndex }) => ({ entityId, lineIndex })),
	'participant:': ({ sequence }, id) =>
		(sequence?.events ?? [])
			.filter((event) =>
				event.kind === 'message'
					? event.stmt.source === id || event.stmt.target === id
					: event.stmt.targets.includes(id)
			)
			.map(({ entityId, lineIndex }) => ({ entityId, lineIndex })),
}

function referrersOf(result: ParseResult, entityId: string): Referrer[] {
	const prefix = Object.keys(REFERRERS).find((candidate) =>
		entityId.startsWith(candidate)
	)
	if (!prefix) return NO_REFERRERS

	return REFERRERS[prefix](result, entityId.slice(prefix.length))
}

/**
 * Visimer's engine, taught to delete an entity the way it already can delete
 * one declared inline.
 *
 * The stock deletion throws on a node, state, class or participant that has a
 * line of its own and is then referred to - the shape authors write most, and
 * the one adding a connected node produces. Removing what refers to it first
 * leaves nothing to overlap.
 *
 * Takes the class rather than importing it, so the dynamic import that keeps
 * visimer out of notes nobody edits visually stays the only way in.
 */
export function createDiagramEngine(
	Engine: EngineClass,
	code: string
): MermaidWysiwygEditor {
	class DiagramEngine extends Engine {
		override deleteEntities(
			entityIds: string[],
			origin?: Parameters<MermaidWysiwygEditor['deleteEntities']>[1]
		) {
			// Two selected entities can share a referrer, and some entity ids are
			// line numbers: deleting one twice would take whatever line moved up
			// into its place. Bottom-up keeps every id still to come pointing at
			// the line it was read from.
			const selected = new Set(entityIds)
			const referrers = new Map(
				entityIds
					.flatMap((id) => referrersOf(this.result, id))
					.filter(({ entityId }) => !selected.has(entityId))
					.map((referrer) => [referrer.entityId, referrer] as const)
			)
			const ordered = [...referrers.values()]
				.sort((a, b) => b.lineIndex - a.lineIndex)
				.map(({ entityId }) => entityId)
			super.deleteEntities([...ordered, ...entityIds], origin)
		}
	}

	return new DiagramEngine({ code })
}
