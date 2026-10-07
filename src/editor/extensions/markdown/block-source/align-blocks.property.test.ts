import fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import { alignBlocks } from '#src/editor/extensions/markdown/block-source/align-blocks'
import type { BlockAlignment } from '#src/editor/extensions/markdown/block-source/align-blocks'
import { fuzzRuns } from '#src/test-utils/fuzz-runs'

/** `current` with every replacement in `alignment` applied. */
function apply(
	alignment: BlockAlignment[],
	current: Array<string | null>,
	incoming: string[]
): Array<string | null> {
	return alignment.flatMap((step) =>
		step.kind === 'keep'
			? [current[step.current]]
			: incoming.slice(step.incoming[0], step.incoming[1])
	)
}

describe('alignBlocks, for any two notes', () => {
	it('rebuilds the incoming blocks exactly when every replacement is applied', () => {
		const blocks = fc.array(
			fc.constantFrom('A', 'B', 'C', 'D', '# H', '- item'),
			{
				maxLength: 12,
			}
		)
		fc.assert(
			fc.property(blocks, blocks, (current, incoming) => {
				const alignment = alignBlocks(current, incoming)

				expect(alignment && apply(alignment, current, incoming)).toEqual(
					incoming
				)
			}),
			{ numRuns: fuzzRuns(200) }
		)
	})
})
