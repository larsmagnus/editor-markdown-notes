import { ADMONITION_TAG_PATTERN } from '#src/lib/admonition-tag'

/**
 * Gives an admonition's `[!TYPE]` line a paragraph of its own - the
 * `updateDOM` step ahead of the literal `"> "` marker, since markdown-it
 * hands back `[!NOTE]\nBody` as one paragraph and the soft break between them
 * collapses to a space. Left that way, `> [!NOTE] Body` is what reaches the
 * file, which GFM does not read as an alert. The blockquote's own serializer
 * writes the pair back tight (see `blockquote-markdown-spec.ts`). A hard break
 * after the tag (trailing spaces or a backslash) arrives as a `<br>` instead,
 * and splits the same way.
 */
export function splitAdmonitionTagParagraph(element: Element): void {
	element.querySelectorAll('blockquote').forEach((quote) => {
		const paragraph = quote.querySelector(':scope > p:first-child')
		const first = paragraph?.firstChild
		if (!paragraph || first?.nodeType !== Node.TEXT_NODE) return

		const [tagLine, ...rest] = (first.textContent ?? '').split('\n')
		const tag = tagLine?.trim() ?? ''
		if (!ADMONITION_TAG_PATTERN.test(tag)) return

		const hardBreak = rest.length === 0 ? first.nextSibling : null
		if (rest.length === 0 && hardBreak?.nodeName !== 'BR') return
		hardBreak?.remove()

		const body = document.createElement('p')
		const remainder = rest.join('\n')
		if (remainder) body.append(document.createTextNode(remainder))
		while (first.nextSibling) body.append(first.nextSibling)

		first.textContent = tag
		if (body.hasChildNodes()) paragraph.after(body)
	})
}
