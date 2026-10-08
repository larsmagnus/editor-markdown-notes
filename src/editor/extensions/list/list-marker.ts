import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

/**
 * A list item's literal leading marker - `- `/`+ `/`* ` for a bullet,
 * `N.`/`N)` for an ordered item, `- [ ]`/`- [x]` for a task - the only
 * source of truth for what an item's marker currently reads as, now that it
 * lives as real text inside the item's own first paragraph (see
 * `create-marker-sync-plugin.ts`). Task is checked before bullet since its
 * pattern extends one.
 */
export type ParsedListMarker =
	| { kind: 'task'; checked: boolean; bulletChar: string; markerLength: number }
	| { kind: 'ordered'; number: number; delimiter: string; markerLength: number }
	| { kind: 'bullet'; bulletChar: string; markerLength: number }

// A marker ends at a space, or at the end of an item with nothing after it.
const TASK_MARKER = /^([-+*]) \[([ xX])\](?: |$)/
const ORDERED_MARKER = /^(\d+)([.)])(?: |$)/
const BULLET_MARKER = /^([-+*])(?: |$)/

/** Parses a list item's own text into its marker, or `null` if it has none yet. */
export function parseListMarker(text: string): ParsedListMarker | null {
	const task = TASK_MARKER.exec(text)
	if (task) {
		return {
			kind: 'task',
			checked: task[2].toLowerCase() === 'x',
			bulletChar: task[1],
			markerLength: task[0].length,
		}
	}

	const ordered = ORDERED_MARKER.exec(text)
	if (ordered) {
		return {
			kind: 'ordered',
			number: Number(ordered[1]),
			delimiter: ordered[2],
			markerLength: ordered[0].length,
		}
	}

	const bullet = BULLET_MARKER.exec(text)
	if (bullet) {
		return {
			kind: 'bullet',
			bulletChar: bullet[1],
			markerLength: bullet[0].length,
		}
	}

	return null
}

/** Builds a fresh bullet marker. */
export function bulletMarkerText(bulletChar = '-'): string {
	return `${bulletChar} `
}

/** Builds a fresh ordered marker for the given number. */
export function orderedMarkerText(n: number, delimiter = '.'): string {
	return `${n}${delimiter} `
}

/** Builds a fresh task marker for the given checked state. */
export function taskMarkerText(checked: boolean, bulletChar = '-'): string {
	return `${bulletChar} [${checked ? 'x' : ' '}] `
}

/**
 * A `listItem`/`taskItem`'s own text starts one node deeper than its own
 * position - past the item's own opening (`+1`) and its first child, the
 * paragraph holding the marker's, opening (`+1` again).
 */
export function firstParagraphStart(itemPos: number): number {
	return itemPos + 2
}

/**
 * The number an ordered list counts from: its first item's own, so a list
 * split off another - `3. three` left after the item above it was lifted out
 * - keeps counting from where it was, not from the original list's start.
 */
function firstNumber(list: ProseMirrorNode): number {
	const parsed = parseListMarker(list.firstChild?.firstChild?.textContent ?? '')
	return parsed?.kind === 'ordered'
		? parsed.number
		: Number(list.attrs.start ?? 1)
}

/**
 * The marker style a new item in `list` takes on - its neighbour's bullet or
 * delimiter, since a list that changes either partway reads back as two.
 */
function neighbourMarker(
	list: ProseMirrorNode,
	index: number
): ParsedListMarker | null {
	const neighbour = (offset: number) =>
		parseListMarker(
			list.maybeChild(index + offset)?.firstChild?.textContent ?? ''
		)
	return neighbour(-1) ?? neighbour(1)
}

/**
 * A list item's marker, corrected against its own node type and its parent
 * list rather than re-read from `text` - see `listMarkerSpec`'s doc comment
 * on why kind and numbering, not style, are the only things ever corrected.
 */
export function resolveListMarker(
	node: ProseMirrorNode,
	parent: ProseMirrorNode | null,
	index: number,
	text: string
): string {
	const parsed = parseListMarker(text)
	const style = parent ? neighbourMarker(parent, index) : null
	const bullet =
		style?.kind === 'bullet' || style?.kind === 'task' ? style.bulletChar : '-'

	if (node.type.name === 'taskItem') {
		return parsed?.kind === 'task'
			? text.slice(0, parsed.markerLength)
			: taskMarkerText(Boolean(node.attrs.checked), bullet)
	}

	if (parent?.type.name === 'orderedList') {
		const expected = firstNumber(parent) + index
		if (parsed?.kind === 'ordered' && parsed.number === expected) {
			return text.slice(0, parsed.markerLength)
		}
		const ownDelimiter = parsed?.kind === 'ordered' ? parsed.delimiter : null
		const neighbourDelimiter = style?.kind === 'ordered' ? style.delimiter : '.'
		return orderedMarkerText(expected, ownDelimiter ?? neighbourDelimiter)
	}

	// A task-shaped marker survives on a bullet item: it is the author typing
	// `- [ ] `, which the task input rule converts once the typed text is in.
	return parsed?.kind === 'bullet' || parsed?.kind === 'task'
		? text.slice(0, parsed.markerLength)
		: bulletMarkerText(bullet)
}
