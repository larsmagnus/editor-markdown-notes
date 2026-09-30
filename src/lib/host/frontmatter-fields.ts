/** The frontmatter fields the index shows, read without a YAML parser. */
export type FrontmatterFields = {
	title: string | null
	name: string | null
	description: string | null
	tags: string[]
}

const TOP_LEVEL_KEY = /^([A-Za-z_][\w-]*):[ \t]*(.*)$/
const BLOCK_LIST_ITEM = /^[ \t]*-[ \t]+(.*)$/
const BLOCK_SCALAR_INDICATOR = /^[|>][-+0-9]*[ \t]*(?:#.*)?$/
const QUOTED = /^(['"])(.*)\1$/
const INLINE_LIST = /^\[(.*)\]$/

/**
 * Reads the few fields the index needs from a frontmatter block.
 *
 * The host ships without dependencies, so this covers only the shapes these
 * fields take in practice - a top-level scalar, and tags as an inline list,
 * a block list or a comma-separated string. Anything richer reads as absent
 * rather than wrong.
 */
export function readFrontmatterFields(frontmatter: string): FrontmatterFields {
	const { scalars, lists } = readTopLevelEntries(frontmatter)

	return {
		title: readScalar(scalars, 'title'),
		name: readScalar(scalars, 'name'),
		description: readScalar(scalars, 'description'),
		tags: lists.get('tags') ?? splitList(scalars.get('tags') ?? ''),
	}
}

/**
 * Splits the block into its top-level `key: value` lines, gathering an empty
 * value's `- item` lines as that key's list. A `|` or `>` block scalar is
 * skipped outright: its text sits on the lines below, which only a real YAML
 * parser can fold.
 */
function readTopLevelEntries(frontmatter: string) {
	const scalars = new Map<string, string>()
	const lists = new Map<string, string[]>()
	let openList: string[] | null = null

	for (const line of frontmatter.split(/\r?\n/)) {
		const item = BLOCK_LIST_ITEM.exec(line)
		if (item && openList) {
			openList.push(unquote(item[1] ?? ''))
			continue
		}

		openList = null
		const [, key, value] = TOP_LEVEL_KEY.exec(line) ?? []
		if (!key) continue

		if (BLOCK_SCALAR_INDICATOR.test(value ?? '')) continue

		if (value) {
			scalars.set(key, value)
			continue
		}

		openList = []
		lists.set(key, openList)
	}

	return { scalars, lists }
}

/** A scalar's unquoted value, or `null` when it is missing or empty. */
function readScalar(scalars: Map<string, string>, key: string): string | null {
	return unquote(scalars.get(key) ?? '') || null
}

/** `[a, "b"]` and `a, b` alike, as their unquoted, non-empty items. */
function splitList(value: string): string[] {
	const trimmed = value.trim()
	const items = INLINE_LIST.exec(trimmed)?.[1] ?? trimmed

	return items.split(',').map(unquote).filter(Boolean)
}

/** Trims `value` and drops one pair of matching surrounding quotes. */
function unquote(value: string): string {
	const trimmed = value.trim()
	return QUOTED.exec(trimmed)?.[2] ?? trimmed
}
