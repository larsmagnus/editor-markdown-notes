import { spliceMdxPlaceholders } from '#src/editor/extensions/mdx-block/splice-mdx-placeholders'
import type { FileKind } from '#src/lib/file-kind'
import { supportsFrontmatter } from '#src/lib/file-kind'
import { splitFrontmatter } from '#src/lib/host/frontmatter'

export type ParseableContent = {
	frontmatter: string | null
	/** Safe to hand to `setContent` - frontmatter's `---` is already split off,
	 *  and any MDX construct is already replaced by a placeholder line. */
	body: string
	/** The MDX spans `body`'s placeholders stand in for, in matching order. */
	mdxBlocks: string[]
}

/**
 * The one place that decides what markdown-it is and isn't allowed to see,
 * given a file's kind - `.txt` keeps its `---` as plain text, and `.mdx`'s
 * JSX/`import`/`export`/`{expression}` constructs get spliced out the same
 * way frontmatter already is, restored afterward as real nodes rather than
 * risking markdown-it silently parsing them away.
 */
export function prepareParseableContent(
	content: string,
	fileKind: FileKind
): ParseableContent {
	const { frontmatter, body } = supportsFrontmatter(fileKind)
		? splitFrontmatter(content)
		: { frontmatter: null, body: content }

	if (fileKind !== 'mdx') return { frontmatter, body, mdxBlocks: [] }

	const { text, blocks } = spliceMdxPlaceholders(body)
	return { frontmatter, body: text, mdxBlocks: blocks }
}
