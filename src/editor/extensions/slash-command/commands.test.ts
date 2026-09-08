import type { JSONContent } from '@tiptap/core'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SLASH_COMMANDS } from '@/editor/extensions/slash-command/commands'
import { createEditor } from '@/test-utils/editor'

const pickImage = vi.hoisted(() => vi.fn())
vi.mock('@/lib/pick-image', () => ({ pickImage }))

function commandFor(id: string) {
	const command = SLASH_COMMANDS.find((item) => item.id === id)
	if (!command) throw new Error(`No slash command registered for "${id}"`)
	return command
}

function bootInsideVSCode() {
	window.vscode = { postMessage: vi.fn(), getState: vi.fn(), setState: vi.fn() }
}

afterEach(() => {
	delete window.vscode
	vi.clearAllMocks()
})

describe('mermaid', () => {
	it('inserts a starter diagram into a mermaid code block', () => {
		const editor = createEditor()

		commandFor('mermaid').run(editor, { from: 1, to: 1 })

		expect(editor.getJSON().content?.[0]).toMatchObject({
			type: 'codeBlock',
			content: [{ type: 'text', text: '```mermaid\ngraph TD\n  A --> B\n```' }],
		})
	})
})

describe('code', () => {
	it('turns the current block into an empty, fenced code block', () => {
		const editor = createEditor()

		commandFor('code').run(editor, { from: 1, to: 1 })

		expect(editor.isActive('codeBlock')).toBe(true)
		expect(editor.getJSON().content?.[0]).toMatchObject({
			type: 'codeBlock',
			content: [{ type: 'text', text: '```\n\n```' }],
		})
		// Regression: this used to land one character too far, on the closing
		// fence's first backtick instead of the blank line between the fences -
		// typing immediately would corrupt the fence.
		expect(editor.state.selection.from).toBe(5)
		expect(editor.state.doc.textBetween(1, editor.state.selection.from)).toBe(
			'```\n'
		)
	})
})

describe('task-list', () => {
	it('turns the current block into a task list item', () => {
		const editor = createEditor()

		commandFor('task-list').run(editor, { from: 1, to: 1 })

		expect(editor.isActive('taskItem')).toBe(true)
	})
})

describe('table', () => {
	it('inserts a 2x2 table with a header row', () => {
		const editor = createEditor()

		commandFor('table').run(editor, { from: 1, to: 1 })

		const table: JSONContent | undefined = editor.getJSON().content?.[0]
		const rows = table?.content ?? []
		expect(table?.type).toBe('table')
		expect(rows).toHaveLength(2)
		expect(rows[0]?.content).toHaveLength(2)
		expect(editor.isActive('tableHeader')).toBe(true)
	})
})

describe('image', () => {
	describe('in VS Code', () => {
		it('inserts the picked image at the caret', async () => {
			bootInsideVSCode()
			pickImage.mockResolvedValue('./diagram.png')
			const editor = createEditor()

			commandFor('image').run(editor, { from: 1, to: 1 })
			await vi.waitFor(() => expect(pickImage).toHaveBeenCalled())
			await vi.waitFor(() => expect(editor.getHTML()).toContain('<img'))

			expect(editor.getHTML()).toContain('src="./diagram.png"')
		})

		it('inserts nothing when the picker is cancelled', async () => {
			bootInsideVSCode()
			pickImage.mockResolvedValue(null)
			const editor = createEditor('# Notes', { parseOnly: true })

			commandFor('image').run(editor, { from: 1, to: 1 })
			await vi.waitFor(() => expect(pickImage).toHaveBeenCalled())

			expect(editor.getHTML()).not.toContain('<img')
		})
	})

	describe('outside VS Code', () => {
		it('inserts an empty image node and reveals its source for editing', () => {
			const editor = createEditor()

			commandFor('image').run(editor, { from: 1, to: 1 })

			expect(pickImage).not.toHaveBeenCalled()
			expect(editor.getHTML()).toContain('<img')
			expect(editor.isActive('imageSource')).toBe(true)
		})
	})
})
