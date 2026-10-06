import type { JSONContent } from '@tiptap/core'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SLASH_COMMANDS } from '#src/editor/extensions/slash-command/commands'
import { createEditor } from '#src/test-utils/editor'

const pickImage = vi.hoisted(() => vi.fn())
vi.mock('#src/lib/pick-image', () => ({ pickImage }))

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

describe('bullet-list', () => {
	it('turns the current block into a bullet list item', () => {
		const editor = createEditor()

		commandFor('bullet-list').run(editor, { from: 1, to: 1 })

		expect(editor.isActive('bulletList')).toBe(true)
	})
})

describe('numbered-list', () => {
	it('turns the current block into a numbered list item', () => {
		const editor = createEditor()

		commandFor('numbered-list').run(editor, { from: 1, to: 1 })

		expect(editor.isActive('orderedList')).toBe(true)
	})
})

describe('raw insertion', () => {
	it.each([
		['mermaid', '```mermaid\ngraph TD\n  A --> B\n```', undefined],
		['code', '```\n\n```', 4],
		['task-list', '- [ ] ', undefined],
		['bullet-list', '- ', undefined],
		['numbered-list', '1. ', undefined],
		['note', '> [!NOTE]\n> ', undefined],
		['tip', '> [!TIP]\n> ', undefined],
		['important', '> [!IMPORTANT]\n> ', undefined],
		['warning', '> [!WARNING]\n> ', undefined],
		['caution', '> [!CAUTION]\n> ', undefined],
		['table', '|  |  |\n| --- | --- |\n|  |  |', 2],
	])('%s writes its markdown', (id, text, caretOffset) => {
		expect(commandFor(id).raw).toEqual({ text, caretOffset })
	})

	it.each(['image', 'ask'])(
		'%s is left out, as it needs a flow of its own',
		(id) => {
			expect(commandFor(id).raw).toBeUndefined()
		}
	)
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

describe.each([
	['note', '> [!NOTE]'],
	['tip', '> [!TIP]'],
	['important', '> [!IMPORTANT]'],
	['warning', '> [!WARNING]'],
	['caution', '> [!CAUTION]'],
])('%s admonition', (id, tagLine) => {
	it('opens a tagged blockquote with the caret in an empty body', () => {
		const editor = createEditor()

		commandFor(id).run(editor, { from: 1, to: 1 })

		const quote = editor.getJSON().content?.[0]
		expect(quote?.type).toBe('blockquote')
		expect(editor.state.doc.firstChild?.firstChild?.textContent).toBe(tagLine)
		expect(editor.state.selection.$from.parent.textContent).toBe('')
		expect(editor.storage.markdown.getMarkdown().trim()).toBe(tagLine)
	})
})
