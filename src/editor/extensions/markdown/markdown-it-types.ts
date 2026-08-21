/**
 * The subset of markdown-it we touch, shared by every extension that patches
 * it through `markdown.parse.setup` (the one parser hook `tiptap-markdown`
 * exposes). The package is a transitive dependency of `tiptap-markdown` and
 * is not resolvable from here, so the shape is declared rather than imported.
 */
export interface MarkdownIt {
	linkify: {
		set: (options: { fuzzyLink: boolean; fuzzyEmail: boolean }) => void
	}
	renderer: {
		rules: Record<string, (tokens: { markup: string }[], idx: number) => string>
	}
}
