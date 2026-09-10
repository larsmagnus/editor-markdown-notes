import { slugifyHeading } from '#src/lib/link/slugify-heading'

/**
 * Slugifies a document's heading texts in order, appending `-1`, `-2`, … to
 * each repeat of an already-seen slug - GitHub's own dedup behavior. Dedup is
 * document-wide, which is why this doesn't just live inside
 * `slugify-heading.ts` itself.
 */
export function slugifyHeadings(texts: string[]): string[] {
	const seen = new Map<string, number>()

	return texts.map((text) => {
		const slug = slugifyHeading(text)
		const count = seen.get(slug) ?? 0
		seen.set(slug, count + 1)

		return count === 0 ? slug : `${slug}-${count}`
	})
}
