import { RULE_TEXT_ATTRIBUTE } from '#src/editor/extensions/markdown/block-source/capture-source-blocks'

/**
 * A horizontal rule's literal text - three or more `-`, `*` or `_`, all the
 * same character. The whole of the node's content is its marker, unlike every
 * other construct where the marker leads content the author is writing: a rule
 * is nothing but its own syntax.
 */
const RULE_TEXT = /^([-*_])(?:[ \t]*\1){2,}[ \t]*$/

/** The default a rule is created with, and what one missing its text becomes. */
export const HORIZONTAL_RULE_TEXT = '---'

/** How much of `text` is rule syntax - all of it, or none. */
export function horizontalRuleLength(text: string): number {
	return RULE_TEXT.test(text) ? text.length : 0
}

/**
 * Reinstates each `<hr>` markdown-it rendered as the literal rule it was
 * written as - `***` stays `***` - falling back to `---` where markdown-it
 * gave no source line. An `<hr>` is void and cannot carry the text, so the
 * element is replaced outright with one the schema can parse into a node with
 * content, keeping its attributes.
 */
export function insertLiteralRules(element: Element): void {
	element.querySelectorAll('hr').forEach((rule) => {
		const written = rule.getAttribute(RULE_TEXT_ATTRIBUTE) ?? ''
		const replacement = element.ownerDocument.createElement('div')
		for (const { name, value } of rule.attributes) {
			replacement.setAttribute(name, value)
		}
		replacement.setAttribute('data-type', 'horizontalRule')
		replacement.textContent =
			horizontalRuleLength(written) > 0 ? written : HORIZONTAL_RULE_TEXT
		rule.replaceWith(replacement)
	})
}
