const VIEW_BOX_WIDTH = /viewBox="\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)/
const MAX_WIDTH = /max-width:\s*([\d.]+)px/

/**
 * The width mermaid's own layout pass drew a diagram at, or nothing when the
 * markup states none.
 *
 * Read out of the markup rather than rewritten into it: mermaid caps its own
 * SVG at this width, and the copy and export actions hand that SVG out
 * verbatim.
 *
 * The `viewBox` is the measurement, since it survives whatever `useMaxWidth`
 * is set to; mermaid's own cap answers for the diagram types that omit one.
 */
export function diagramWidth(svg: string): number | undefined {
	const width = VIEW_BOX_WIDTH.exec(svg)?.[1] ?? MAX_WIDTH.exec(svg)?.[1]

	return width === undefined ? undefined : Number(width)
}
