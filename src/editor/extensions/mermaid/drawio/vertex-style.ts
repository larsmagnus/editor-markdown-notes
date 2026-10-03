const PLAIN = 'whiteSpace=wrap'

const STYLE_BY_TYPE: Record<string, string> = {
	square: PLAIN,
	round: `rounded=1;${PLAIN}`,
	stadium: `rounded=1;arcSize=50;${PLAIN}`,
	diamond: `rhombus;${PLAIN}`,
	hexagon: `shape=hexagon;perimeter=hexagonPerimeter2;${PLAIN}`,
	circle: `ellipse;aspect=fixed;${PLAIN}`,
	doublecircle: `shape=doubleEllipse;aspect=fixed;${PLAIN}`,
	cylinder: `shape=cylinder3;boundedLbl=1;backgroundOutline=1;${PLAIN}`,
	cyl: `shape=cylinder3;boundedLbl=1;backgroundOutline=1;${PLAIN}`,
	subroutine: `shape=process;${PLAIN}`,
	lean_right: `shape=parallelogram;perimeter=parallelogramPerimeter;${PLAIN}`,
	lean_left: `shape=parallelogram;perimeter=parallelogramPerimeter;flipH=1;${PLAIN}`,
	trapezoid: `shape=trapezoid;perimeter=trapezoidPerimeter;${PLAIN}`,
	inv_trapezoid: `shape=trapezoid;perimeter=trapezoidPerimeter;flipV=1;${PLAIN}`,
}

/** The nearest stock draw.io shape for a mermaid node type; a plain box if none. */
export function vertexStyle(type: string | undefined) {
	return (type && STYLE_BY_TYPE[type]) || PLAIN
}
