/**
 * Serialises a value for embedding in an inline `<script>`. `JSON.stringify`
 * leaves `<` untouched, so a markdown file containing the literal `</script>`
 * — very common when documenting HTML — would otherwise close the block early
 * and load the editor blank.
 */
export function toScriptLiteral(value: unknown): string {
	return JSON.stringify(value).replace(/</g, '\\u003c')
}
