import { headingMarkerText } from '#src/editor/extensions/heading/heading-marker'

/**
 * Reinstates literal `#`x`level` marker text into every `h1`-`h6` markdown-it
 * rendered - the `updateDOM` hook that runs before the schema's own
 * `parseHTML`, since markdown-it's heading rule carries the level only in the
 * tag name, never as literal text in the HTML it hands off.
 */
export function insertLiteralHeadingMarkers(element: Element): void {
	element.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((heading) => {
		const level = Number(heading.tagName[1])
		heading.prepend(document.createTextNode(headingMarkerText(level)))
	})
}
