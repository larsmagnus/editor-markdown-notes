import { afterEach, describe, expect, it } from 'vitest'

import { filterCommands } from './extension'

afterEach(() => {
	delete window.vscode
})

describe('filterCommands', () => {
	it('hides a vscodeOnly command outside the VS Code webview', () => {
		const items = filterCommands('ask')

		expect(items.find((item) => item.id === 'ask')).toBeUndefined()
	})

	it('includes a vscodeOnly command inside the VS Code webview', () => {
		window.vscode = {
			postMessage: () => {},
			getState: () => {},
			setState: () => {},
		}

		const items = filterCommands('ask')

		expect(items.find((item) => item.id === 'ask')).toBeDefined()
	})

	it('still matches other commands by keyword regardless of context', () => {
		const items = filterCommands('flowchart')

		expect(items.map((item) => item.id)).toEqual(['mermaid'])
	})

	it('ranks a label match above a command that only matches by keyword substring', () => {
		window.vscode = {
			postMessage: () => {},
			getState: () => {},
			setState: () => {},
		}

		// "task-list"'s `task` keyword contains "ask" as a substring, but "Ask
		// Claude" is the query's actual intent and must list first.
		const items = filterCommands('ask')

		expect(items.map((item) => item.id)).toEqual(['ask', 'task-list'])
	})
})
