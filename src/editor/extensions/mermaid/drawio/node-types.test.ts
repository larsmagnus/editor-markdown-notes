import { describe, expect, it } from 'vitest'

import { readNodeTypes } from '#src/editor/extensions/mermaid/drawio/node-types'

describe('readNodeTypes', () => {
	it('reports the shape each flowchart node was written with', async () => {
		const types = await readNodeTypes(
			'flowchart TD\n  A([Start]) --> B[(Orders)]\n  B --> C{Ship it?}'
		)

		expect(Object.fromEntries(types)).toEqual({
			A: 'stadium',
			B: 'cylinder',
			C: 'diamond',
		})
	})

	it('reports nothing for a diagram type without flowchart nodes', async () => {
		const types = await readNodeTypes('sequenceDiagram\n  Alice->>Bob: Hi')

		expect(types.size).toBe(0)
	})

	it('reports nothing for source mermaid cannot parse', async () => {
		const types = await readNodeTypes('flowchart TD\n  A[unclosed')

		expect(types.size).toBe(0)
	})
})
