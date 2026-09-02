/**
 * A horizontal rule's literal text - three or more `-`, `*` or `_`, all the
 * same character. The whole of the node's content is its marker, unlike every
 * other construct where the marker leads content the author is writing: a rule
 * is nothing but its own syntax.
 */
const RULE_TEXT = /^([-*_])\1{2,}[ \t]*$/

/** The default a rule is created with, and what one missing its text becomes. */
export const HORIZONTAL_RULE_TEXT = '---'

/** How much of `text` is rule syntax - all of it, or none. */
export function horizontalRuleLength(text: string): number {
	return RULE_TEXT.test(text) ? text.length : 0
}

/**
 * Reinstates literal `---` into every `<hr>` markdown-it rendered. An `<hr>`
 * is void and cannot carry the text, so the element is replaced outright with
 * one the schema can parse into a node with content.
 */
export function insertLiteralRules(element: Element): void {
	element.querySelectorAll('hr').forEach((rule) => {
		const replacement = element.ownerDocument.createElement('div')
		replacement.setAttribute('data-type', 'horizontalRule')
		replacement.textContent = HORIZONTAL_RULE_TEXT
		rule.replaceWith(replacement)
	})
}
