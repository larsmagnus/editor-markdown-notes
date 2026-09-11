/**
 * The border/hover/focus chrome every `PanZoom`-hosted media shares - an
 * image and a mermaid diagram alike. Kept as one constant so the two can't
 * drift: a diagram has no click-to-select (a click there starts a pan
 * instead), so `focus-within` is the one state it can still show, and an
 * image's own `NodeSelection`-driven ring reuses these same tokens rather
 * than inventing a second look for the same idea.
 */
export const PAN_ZOOM_FRAME_CLASSNAME =
	'rounded-md border border-border/50 p-2 hover:border-border focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/50'
