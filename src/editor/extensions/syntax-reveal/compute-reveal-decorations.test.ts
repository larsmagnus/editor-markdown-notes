import StarterKit from '@tiptap/starter-kit'
import { describe, expect, it } from 'vitest'

import { computeRevealDecorations } from '#src/editor/extensions/syntax-reveal/compute-reveal-decorations'
import type { RevealProvider } from '#src/editor/extensions/syntax-reveal/reveal-provider'
import { revealRanges } from '#src/editor/extensions/syntax-reveal/reveal-ranges'
import { createEditor } from '#src/test-utils/editor'

describe('computeRevealDecorations', () => {
	// "hello world" -> "hello" spans doc positions 1-6, "world" spans 7-12.
	it('decorates a syntax token when the selection is outside its container', () => {
		const editor = createEditor('<p>hello world</p>', {
			extensions: [StarterKit],
		})
		editor.commands.setTextSelection(9) // inside "world"

		const provider: RevealProvider = {
			collect: () => [
				{
					containerFrom: 1,
					containerTo: 6,
					tokens: [{ role: 'marker', from: 1, to: 2 }],
				},
			],
		}

		const ranges = revealRanges(editor.state.doc, editor.state.selection, [
			provider,
		])
		const decorations = computeRevealDecorations(editor.state.doc, ranges)

		expect(decorations.find(1, 2)).toHaveLength(1)
	})

	it('still decorates a revealed token, at the same range', () => {
		const editor = createEditor('<p>hello world</p>', {
			extensions: [StarterKit],
		})
		editor.commands.setTextSelection(3) // inside "hello"

		const provider: RevealProvider = {
			collect: () => [
				{
					containerFrom: 1,
					containerTo: 6,
					tokens: [{ role: 'marker', from: 1, to: 2 }],
				},
			],
		}

		const ranges = revealRanges(editor.state.doc, editor.state.selection, [
			provider,
		])
		const decorations = computeRevealDecorations(editor.state.doc, ranges)

		expect(decorations.find(1, 2)).toHaveLength(1)
	})

	it('reveals when the selection only partially overlaps the container', () => {
		const editor = createEditor('<p>hello world</p>', {
			extensions: [StarterKit],
		})
		// Starts inside the container ("hello"), ends outside it ("world").
		editor.commands.setTextSelection({ from: 3, to: 9 })

		const provider: RevealProvider = {
			collect: () => [
				{
					containerFrom: 1,
					containerTo: 6,
					tokens: [{ role: 'marker', from: 1, to: 2 }],
				},
			],
		}

		const ranges = revealRanges(editor.state.doc, editor.state.selection, [
			provider,
		])
		const decorations = computeRevealDecorations(editor.state.doc, ranges)

		expect(decorations.find(1, 2)).toHaveLength(1)
	})

	it('drops a syntax token that has collapsed or runs past the document end', () => {
		const editor = createEditor('<p>hi</p>', { extensions: [StarterKit] })
		editor.commands.setTextSelection(1)

		const provider: RevealProvider = {
			collect: () => [
				{
					containerFrom: 1,
					containerTo: 2,
					tokens: [
						{ role: 'marker', from: 2, to: 2 },
						{ role: 'marker', from: 1, to: 999 },
					],
				},
			],
		}

		expect(() => {
			const ranges = revealRanges(editor.state.doc, editor.state.selection, [
				provider,
			])
			computeRevealDecorations(editor.state.doc, ranges)
		}).not.toThrow()
	})

	it('merges spans from multiple providers', () => {
		const editor = createEditor('<p>hello world</p>', {
			extensions: [StarterKit],
		})
		editor.commands.setTextSelection(9)

		const first: RevealProvider = {
			collect: () => [
				{
					containerFrom: 1,
					containerTo: 6,
					tokens: [{ role: 'marker', from: 1, to: 2 }],
				},
			],
		}
		const second: RevealProvider = {
			collect: () => [
				{
					containerFrom: 1,
					containerTo: 6,
					tokens: [{ role: 'marker', from: 3, to: 4 }],
				},
			],
		}

		const ranges = revealRanges(editor.state.doc, editor.state.selection, [
			first,
			second,
		])
		const decorations = computeRevealDecorations(editor.state.doc, ranges)

		expect(decorations.find(1, 2)).toHaveLength(1)
		expect(decorations.find(3, 4)).toHaveLength(1)
	})

	it('marks a revealed block construct via revealedNode', () => {
		const editor = createEditor('<p>hello world</p>', {
			extensions: [StarterKit],
		})
		editor.commands.setTextSelection(3)

		const provider: RevealProvider = {
			collect: () => [
				{
					containerFrom: 1,
					containerTo: 6,
					tokens: [{ role: 'marker', from: 1, to: 2 }],
					revealedNode: [0, 13],
				},
			],
		}

		const ranges = revealRanges(editor.state.doc, editor.state.selection, [
			provider,
		])
		const decorations = computeRevealDecorations(editor.state.doc, ranges)

		expect(
			decorations.find(0, 13).some((d) => d.from === 0 && d.to === 13)
		).toBe(true)
	})
})
