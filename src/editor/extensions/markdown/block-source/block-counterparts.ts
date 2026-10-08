import type { CurrentBlocks } from '#src/editor/extensions/markdown/block-source/current-blocks'

/**
 * Which incoming block stands for each of the author's changed blocks in a
 * replaced run: the one still holding the text it was loaded with, or - when
 * the outside change rewrote that too - the one at the same place in a run of
 * the same length. One with no counterpart was new to the run.
 */
export function counterparts(
	current: CurrentBlocks,
	incomingTexts: string[],
	[from, to]: [number, number],
	[incomingFrom, incomingTo]: [number, number]
): Map<number, number> {
	const found = new Map<number, number>()
	const taken = new Set<number>()
	const claim = (index: number, counterpart: number) => {
		found.set(counterpart, index)
		taken.add(counterpart)
	}

	for (let index = from; index < to; index++) {
		if (current.texts[index] !== null) continue
		for (let j = incomingFrom; j < incomingTo; j++) {
			if (!taken.has(j) && incomingTexts[j] === current.originals[index]) {
				claim(index, j)
				break
			}
		}
	}
	if (to - from === incomingTo - incomingFrom) {
		for (let index = from; index < to; index++) {
			const j = incomingFrom + index - from
			const placed = [...found.values()].includes(index)
			if (current.texts[index] === null && !placed && !taken.has(j))
				claim(index, j)
		}
	}
	return found
}
