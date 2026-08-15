import { Editor } from '@tiptap/core'
import type { JSONContent } from '@tiptap/core'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { extensions } from '@/editor/extensions'
import { SLASH_COMMANDS } from '@/editor/slash-command/commands'

const pickImage = vi.hoisted(() => vi.fn())
vi.mock('@/lib/pick-image', () => ({ pickImage }))

function commandFor(id: string) {
	const command = SLASH_COMMANDS.find((item) => item.id === id)
	if (!command) throw new Error(`No slash command registered for "${id}"`)
	return command
}

let currentEditor: Editor | undefined

function bootInsideVSCode() {
	window.vscode = { postMessage: vi.fn(), getState: vi.fn(), setState: vi.fn() }
}

afterEach(() => {
	currentEditor?.destroy()
	currentEditor = undefined
	delete window.vscode
	vi.clearAllMocks()
})

describe('mermaid', () => {
	it('inserts a starter diagram into a mermaid code block', () => {
		const editor = new Editor({ extensions, content: '' })
		currentEditor = editor

		commandFor('mermaid').run(editor, { from: 1, to: 1 })

		expect(editor.getJSON().content?.[0]).toMatchObject({
			type: 'codeBlock',
			attrs: { language: 'mermaid' },
			content: [{ type: 'text', text: 'graph TD\n  A --> B' }],
		})
	})
})

describe('code', () => {
	it('turns the current block into an empty code block', () => {
		const editor = new Editor({ extensions, content: '' })
		currentEditor = editor

		commandFor('code').run(editor, { from: 1, to: 1 })

		expect(editor.isActive('codeBlock')).toBe(true)
		expect(editor.getJSON().content?.[0]).toMatchObject({ type: 'codeBlock' })
		expect(editor.getJSON().content?.[0]?.content).toBeUndefined()
	})
})

describe('task-list', () => {
	it('turns the current block into a task list item', () => {
		const editor = new Editor({ extensions, content: '' })
		currentEditor = editor

		commandFor('task-list').run(editor, { from: 1, to: 1 })

		expect(editor.isActive('taskItem')).toBe(true)
	})
})

describe('table', () => {
	it('inserts a 2x2 table with a header row', () => {
		const editor = new Editor({ extensions, content: '' })
		currentEditor = editor

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
			const editor = new Editor({ extensions, content: '' })
			currentEditor = editor

			commandFor('image').run(editor, { from: 1, to: 1 })
			await vi.waitFor(() => expect(pickImage).toHaveBeenCalled())
			await vi.waitFor(() => expect(editor.getHTML()).toContain('<img'))

			expect(editor.getHTML()).toContain('src="./diagram.png"')
		})

		it('inserts nothing when the picker is cancelled', async () => {
			bootInsideVSCode()
			pickImage.mockResolvedValue(null)
			const editor = new Editor({ extensions, content: '# Notes' })
			currentEditor = editor

			commandFor('image').run(editor, { from: 1, to: 1 })
			await vi.waitFor(() => expect(pickImage).toHaveBeenCalled())

			expect(editor.getHTML()).not.toContain('<img')
		})
	})

	describe('outside VS Code', () => {
		it('inserts an empty, selected image node instead of picking one', () => {
			const editor = new Editor({ extensions, content: '' })
			currentEditor = editor

			commandFor('image').run(editor, { from: 1, to: 1 })

			expect(pickImage).not.toHaveBeenCalled()
			expect(editor.getHTML()).toContain('<img')
			expect(editor.isActive('image')).toBe(true)
			expect(editor.getAttributes('image').src).toBe('')
		})
	})
})
