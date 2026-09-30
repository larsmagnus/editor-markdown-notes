import { splitFrontmatter } from '#src/lib/host/frontmatter'
import { readFrontmatterFields } from '#src/lib/host/frontmatter-fields'
import { findH1, firstTextLine } from '#src/lib/host/markdown-title'
import type { NoteSummary } from '#src/shared/messages'

const WORD = /[\p{L}\p{N}][\p{L}\p{N}'’_-]*/gu

/**
 * What the index shows for one note.
 *
 * The title prefers what the author declared over what the text implies:
 * frontmatter `title`, then `name` (agent and skill files), then the first h1,
 * then the opening line of text, and the file name only for a note with none.
 * Counts cover the body alone, since frontmatter is not what anyone wrote.
 */
export function summarizeNote(markdown: string, fileName: string): NoteSummary {
	const { frontmatter, body } = splitFrontmatter(markdown)
	const fields = readFrontmatterFields(frontmatter ?? '')

	return {
		title:
			fields.title ??
			fields.name ??
			findH1(body) ??
			firstTextLine(body) ??
			fileName,
		description: fields.description,
		tags: fields.tags,
		characters: [...body].length,
		words: body.match(WORD)?.length ?? 0,
	}
}
