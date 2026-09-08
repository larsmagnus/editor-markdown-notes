import { getSchema } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { describe, expect, it } from 'vitest'

import { paragraphWithoutLeadingText } from '#src/editor/extensions/paragraph-without-leading-text'

const schema = getSchema([StarterKit])

function paragraph(text: string) {
	return schema.nodes.paragraph.create(null, text ? schema.text(text) : null)
}

describe('paragraphWithoutLeadingText', () => {
	it('returns the paragraph unchanged when length is 0', () => {
		const node = paragraph('- Buy milk')

		expect(paragraphWithoutLeadingText(node, 0)).toBe(node)
	})

	it('strips the given number of leading characters', () => {
		const node = paragraph('- Buy milk')

		expect(paragraphWithoutLeadingText(node, 2).textContent).toBe('Buy milk')
	})

	it('produces an empty paragraph when the marker is the entire content', () => {
		const node = paragraph('- ')

		expect(paragraphWithoutLeadingText(node, 2).textContent).toBe('')
	})

	it('returns the paragraph unchanged when it has no text content at all', () => {
		const node = paragraph('')

		expect(paragraphWithoutLeadingText(node, 2)).toBe(node)
	})

	it('preserves marks on the remaining text', () => {
		const boldText = schema.text('- Buy milk', [schema.marks.bold.create()])
		const node = schema.nodes.paragraph.create(null, boldText)

		const stripped = paragraphWithoutLeadingText(node, 2)
		expect(stripped.textContent).toBe('Buy milk')
		expect(
			schema.marks.bold.isInSet(stripped.firstChild?.marks ?? [])
		).toBeTruthy()
	})
})
