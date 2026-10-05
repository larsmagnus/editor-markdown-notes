import * as core from '@visimer/core'
import { describe, expect, it } from 'vitest'

import { createDiagramEngine } from '#src/editor/extensions/mermaid/visual-editor/diagram-engine'

const FLOWCHART = [
	'graph TD',
	'  A[Start] --> B{Decision}',
	'  B -->|Yes| C[Finish]',
	'  %% keep me',
	'  E[End]',
	'  C --> E',
].join('\n')

describe('createDiagramEngine', () => {
	// The stock engine throws "Overlapping text edits" on this shape: a node
	// declared on its own line and then referenced by an edge.
	it('deletes a node declared on its own line along with its edges', () => {
		const engine = createDiagramEngine(core.MermaidWysiwygEditor, FLOWCHART)

		engine.deleteEntities(['node:E'])

		expect(engine.code).toBe(
			[
				'graph TD',
				'  A[Start] --> B{Decision}',
				'  B -->|Yes| C[Finish]',
				'  %% keep me',
			].join('\n')
		)
	})

	it('deletes a node reached by edges in both directions', () => {
		const engine = createDiagramEngine(
			core.MermaidWysiwygEditor,
			'graph TD\n  A[Start]\n  B[Middle]\n  C[End]\n  A --> B\n  B --> C'
		)

		engine.deleteEntities(['node:B'])

		expect(engine.code).toBe('graph TD\n  A[Start]\n  C[End]')
	})

	it('deletes only the edge when only an edge is selected', () => {
		const engine = createDiagramEngine(core.MermaidWysiwygEditor, FLOWCHART)

		engine.deleteEntities(['edge:C->E#0'])

		expect(engine.code).toContain('  E[End]')
		expect(engine.code).not.toContain('C --> E')
	})

	it('deletes a declared participant along with its messages and notes', () => {
		const engine = createDiagramEngine(
			core.MermaidWysiwygEditor,
			[
				'sequenceDiagram',
				'  participant A as Alice',
				'  participant B as Bob',
				'  A->>B: Hello',
				'  Note over A,B: shared',
				'  Note right of B: aside',
				'  B-->>A: Hi',
			].join('\n')
		)

		engine.deleteEntities(['participant:B'])

		expect(engine.code).toBe(
			['sequenceDiagram', '  participant A as Alice'].join('\n')
		)
	})

	it('deletes a declared state along with its transitions', () => {
		const engine = createDiagramEngine(
			core.MermaidWysiwygEditor,
			[
				'stateDiagram-v2',
				'  state "Busy" as Busy',
				'  [*] --> Idle',
				'  Idle --> Busy: go',
				'  Busy --> Idle: stop',
			].join('\n')
		)

		engine.deleteEntities(['state:Busy'])

		expect(engine.code).toBe(['stateDiagram-v2', '  [*] --> Idle'].join('\n'))
	})

	it('deletes a declared class along with its relations', () => {
		const engine = createDiagramEngine(
			core.MermaidWysiwygEditor,
			[
				'classDiagram',
				'  class Animal',
				'  class Dog',
				'  Animal <|-- Dog',
			].join('\n')
		)

		engine.deleteEntities(['class:Dog'])

		expect(engine.code).toBe(['classDiagram', '  class Animal'].join('\n'))
	})

	it('deletes two connected nodes selected together', () => {
		const engine = createDiagramEngine(
			core.MermaidWysiwygEditor,
			'graph TD\n  A[Start]\n  B[Middle]\n  C[End]\n  A --> B\n  B --> C'
		)

		engine.deleteEntities(['node:B', 'node:C'])

		expect(engine.code).toBe('graph TD\n  A[Start]')
	})

	it('deletes a node selected together with an edge it is on', () => {
		const engine = createDiagramEngine(
			core.MermaidWysiwygEditor,
			'graph TD\n  A[Start]\n  B[End]\n  A --> B'
		)

		engine.deleteEntities(['edge:A->B#0', 'node:B'])

		expect(engine.code).toBe('graph TD\n  A[Start]')
	})

	it('deletes two participants selected together', () => {
		const engine = createDiagramEngine(
			core.MermaidWysiwygEditor,
			[
				'sequenceDiagram',
				'  participant A as Alice',
				'  participant B as Bob',
				'  participant C as Carol',
				'  A->>B: Hello',
				'  B->>C: Pass it on',
				'  C->>A: Done',
				'  A->>A: Think',
			].join('\n')
		)

		engine.deleteEntities(['participant:B', 'participant:C'])

		expect(engine.code).toBe(
			['sequenceDiagram', '  participant A as Alice', '  A->>A: Think'].join(
				'\n'
			)
		)
	})
})
