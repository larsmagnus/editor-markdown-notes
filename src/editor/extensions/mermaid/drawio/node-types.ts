import { z } from 'zod'

/** Narrows without copying: the method must run on the parser's own `db`. */
function hasVertices(db: object): db is { getVertices: () => unknown } {
	return 'getVertices' in db && typeof db.getVertices === 'function'
}

const VerticesSchema = z.map(
	z.string(),
	z.object({ type: z.string().optional() })
)

/**
 * Which shape each flowchart node was written with, keyed by its name in the
 * source.
 *
 * The rendered SVG does not say: a stadium and a flag are both anonymous
 * paths, so the parser is the only reliable witness. Empty for anything that
 * is not a flowchart or does not parse, which draws as plain boxes.
 */
export async function readNodeTypes(code: string) {
	try {
		const { default: mermaid } = await import('mermaid')
		// Diagram detectors are registered by initialize; without it a fresh
		// module cannot recognise any syntax.
		mermaid.initialize({ startOnLoad: false })
		const { db } = await mermaid.mermaidAPI.getDiagramFromText(code)
		if (!hasVertices(db)) return new Map<string, string>()
		const vertices = VerticesSchema.parse(db.getVertices())
		return new Map(
			Array.from(vertices, ([name, { type }]) => [name, type] as const).flatMap(
				([name, type]) => (type ? [[name, type] as const] : [])
			)
		)
	} catch {
		return new Map<string, string>()
	}
}
