export type DrawioStyle = Map<string, string>

/** `key=value;flag;` as a map, a bare flag mapping to the empty string. */
export function parseStyle(style: string | null): DrawioStyle {
	return new Map(
		(style ?? '')
			.split(';')
			.filter(Boolean)
			.map((token) => {
				const [key = '', ...value] = token.split('=')
				return [key, value.join('=')] as const
			})
	)
}

const rectangle = (label: string) => `["${label}"]`

/** Mermaid's bracket syntax per draw.io shape, a table rather than a dispatch. */
const SHAPES: Record<string, (label: string) => string> = {
	ellipse: (label) => `(("${label}"))`,
	rhombus: (label) => `{"${label}"}`,
	hexagon: (label) => `{{"${label}"}}`,
	cylinder: (label) => `[("${label}")]`,
	cylinder3: (label) => `[("${label}")]`,
	parallelogram: (label) => `[/"${label}"/]`,
}

const rounded = (label: string) => `("${label}")`

/**
 * Wraps `label` in the brackets for the shape `style` draws. The shape is
 * either named by `shape=` or is the bare first token (`ellipse;`).
 */
export function wrapNodeLabel(style: DrawioStyle, label: string) {
	const shape = [style.get('shape'), ...style.keys()].find(
		(name): name is string => name !== undefined && Object.hasOwn(SHAPES, name)
	)
	const wrap =
		(shape ? SHAPES[shape] : undefined) ??
		(style.get('rounded') === '1' ? rounded : rectangle)
	return wrap(label)
}

const LINKS = {
	'solid-arrow': '-->',
	'solid-none': '---',
	'dashed-arrow': '-.->',
	'dashed-none': '-.-',
}

/** The link operator for an edge's line pattern and arrowhead. */
export function linkOperator(style: DrawioStyle) {
	const line = style.get('dashed') === '1' ? 'dashed' : 'solid'
	const head = style.get('endArrow') === 'none' ? 'none' : 'arrow'
	return LINKS[`${line}-${head}`]
}

/**
 * A label as one line of mermaid text. `html=1` labels hold markup, which is
 * flattened with line breaks kept; a double quote would end the quoted label
 * so it is written as mermaid's own entity.
 */
export function cleanLabel(value: string, style: DrawioStyle) {
	const text =
		style.get('html') === '1'
			? (new DOMParser().parseFromString(
					value.replace(/<br\s*\/?>/gi, '\n'),
					'text/html'
				).body.textContent ?? '')
			: value
	return text.replaceAll('"', '#quot;').split('\n').join('<br/>')
}
