/**
 * A list item's literal leading marker - `- `/`+ `/`* ` for a bullet,
 * `N.`/`N)` for an ordered item, `- [ ]`/`- [x]` for a task - the only
 * source of truth for what an item's marker currently reads as, now that it
 * lives as real text inside the item's own first paragraph (see
 * `list-marker-sync-plugin.ts`). Task is checked before bullet since its
 * pattern extends one.
 */
export type ParsedListMarker =
	| { kind: 'task'; checked: boolean; markerLength: number }
	| { kind: 'ordered'; number: number; markerLength: number }
	| { kind: 'bullet'; bulletChar: string; markerLength: number }

const TASK_MARKER = /^([-+*]) \[([ xX])\] /
const ORDERED_MARKER = /^(\d+)[.)] /
const BULLET_MARKER = /^([-+*]) /

/** Parses a list item's own text into its marker, or `null` if it has none yet. */
export function parseListMarker(text: string): ParsedListMarker | null {
	const task = TASK_MARKER.exec(text)
	if (task) {
		return {
			kind: 'task',
			checked: task[2].toLowerCase() === 'x',
			markerLength: task[0].length,
		}
	}

	const ordered = ORDERED_MARKER.exec(text)
	if (ordered) {
		return {
			kind: 'ordered',
			number: Number(ordered[1]),
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
export function orderedMarkerText(n: number): string {
	return `${n}. `
}

/** Builds a fresh task marker for the given checked state. */
export function taskMarkerText(checked: boolean): string {
	return `- [${checked ? 'x' : ' '}] `
}

/**
 * A `listItem`/`taskItem`'s own text starts one node deeper than its own
 * position - past the item's own opening (`+1`) and its first child, the
 * paragraph holding the marker's, opening (`+1` again).
 */
export function firstParagraphStart(itemPos: number): number {
	return itemPos + 2
}
