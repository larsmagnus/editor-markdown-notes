export type Point = { x: number; y: number }

export type Vertex = {
	kind: 'vertex'
	id: string
	label: string
	style: string
	x: number
	y: number
	width: number
	height: number
}

export type Edge = {
	kind: 'edge'
	id: string
	label: string
	style: string
	source?: string
	target?: string
	waypoints: Point[]
}

export type DrawioCell = Vertex | Edge
