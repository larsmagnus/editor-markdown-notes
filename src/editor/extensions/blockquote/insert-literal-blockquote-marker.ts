import { BLOCKQUOTE_MARKER } from '#src/editor/extensions/blockquote/blockquote-marker'

/**
 * Reinstates the literal `"> "` marker into every blockquote's own first
 * `<p>` - the `updateDOM` hook that runs before the schema's own
 * `parseHTML`, since markdown-it's blockquote HTML carries no literal marker
 * text at all. Runs once per `<blockquote>` in the document, nested ones
 * included - each contributes only its own single level's marker to its own
 * first paragraph, the same "only the innermost level is ever real text"
 * design `create-marker-sync-plugin.ts` documents.
 */
export function insertLiteralBlockquoteMarker(element: Element): void {
	element.querySelectorAll('blockquote').forEach((quote) => {
		quote
			.querySelector(':scope > p:first-child')
			?.prepend(document.createTextNode(BLOCKQUOTE_MARKER))
	})
}
