import StarterKit from '@tiptap/starter-kit'
import { describe, expect, it } from 'vitest'

import { computeRevealDecorations } from '#src/editor/extensions/syntax-reveal/compute-reveal-decorations'
import type { RevealProvider } from '#src/editor/extensions/syntax-reveal/reveal-provider'
import { createEditor } from '#src/test-utils/editor'

describe('computeRevealDecorations', () => {
	// "hello world" -> "hello" spans doc positions 1-6, "world" spans 7-12.
	it('hides a syntax range when the selection is outside its container', () => {
		const editor = createEditor('<p>hello world</p>', {
			extensions: [StarterKit],
		})
		editor.commands.setTextSelection(9) // inside "world"

		const provider: RevealProvider = {
			collect: () => [
				{ containerFrom: 1, containerTo: 6, syntaxRanges: [[1, 2]] },
			],
		}

		const decorations = computeRevealDecorations(
			editor.state.doc,
			editor.state.selection,
			[provider]
		)

		expect(decorations.find(1, 2)).toHaveLength(1)
	})

	it('reveals (no decoration) once the selection overlaps the container', () => {
		const editor = createEditor('<p>hello world</p>', {
			extensions: [StarterKit],
		})
		editor.commands.setTextSelection(3) // inside "hello"

		const provider: RevealProvider = {
			collect: () => [
				{ containerFrom: 1, containerTo: 6, syntaxRanges: [[1, 2]] },
			],
		}

		const decorations = computeRevealDecorations(
			editor.state.doc,
			editor.state.selection,
			[provider]
		)

		expect(decorations.find(1, 2)).toHaveLength(0)
	})

	it('reveals when the selection only partially overlaps the container', () => {
		const editor = createEditor('<p>hello world</p>', {
			extensions: [StarterKit],
		})
		// Starts inside the container ("hello"), ends outside it ("world").
		editor.commands.setTextSelection({ from: 3, to: 9 })

		const provider: RevealProvider = {
			collect: () => [
				{ containerFrom: 1, containerTo: 6, syntaxRanges: [[1, 2]] },
			],
		}

		const decorations = computeRevealDecorations(
			editor.state.doc,
			editor.state.selection,
			[provider]
		)

		expect(decorations.find(1, 2)).toHaveLength(0)
	})

	it('drops a syntax range that has collapsed or runs past the document end', () => {
		const editor = createEditor('<p>hi</p>', { extensions: [StarterKit] })
		editor.commands.setTextSelection(1)

		const provider: RevealProvider = {
			collect: () => [
				{
					containerFrom: 1,
					containerTo: 2,
					syntaxRanges: [
						[2, 2],
						[1, 999],
					],
				},
			],
		}

		expect(() =>
			computeRevealDecorations(editor.state.doc, editor.state.selection, [
				provider,
			])
		).not.toThrow()
	})

	it('merges spans from multiple providers', () => {
		const editor = createEditor('<p>hello world</p>', {
			extensions: [StarterKit],
		})
		editor.commands.setTextSelection(9)

		const first: RevealProvider = {
			collect: () => [
				{ containerFrom: 1, containerTo: 6, syntaxRanges: [[1, 2]] },
			],
		}
		const second: RevealProvider = {
			collect: () => [
				{ containerFrom: 1, containerTo: 6, syntaxRanges: [[3, 4]] },
			],
		}

		const decorations = computeRevealDecorations(
			editor.state.doc,
			editor.state.selection,
			[first, second]
		)

		expect(decorations.find(1, 2)).toHaveLength(1)
		expect(decorations.find(3, 4)).toHaveLength(1)
	})
})
