import { afterEach, describe, expect, it, vi } from 'vitest'

import { createEditor } from '#src/test-utils/editor'

function bootInsideVSCode() {
	const postMessage = vi.fn()
	window.vscode = { postMessage, getState: vi.fn(), setState: vi.fn() }
	return postMessage
}

function click(link: Element) {
	link.dispatchEvent(
		new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 })
	)
}

afterEach(() => {
	delete window.vscode
	vi.clearAllMocks()
})

describe('link click handling', () => {
	it('still opens an absolute link through window.open, unchanged', () => {
		const windowOpen = vi.spyOn(window, 'open').mockImplementation(() => null)
		const editor = createEditor('[notes](https://example.com)', {
			mount: true,
		})

		click(editor.view.dom.querySelector('a')!)

		expect(windowOpen).toHaveBeenCalledWith(
			'https://example.com',
			'_blank',
			'noopener,noreferrer'
		)
	})

	it('routes a relative link through the host instead of window.open', () => {
		const windowOpen = vi.spyOn(window, 'open').mockImplementation(() => null)
		const postMessage = bootInsideVSCode()
		const editor = createEditor('[notes](./notes.md)', { mount: true })

		click(editor.view.dom.querySelector('a')!)

		expect(postMessage).toHaveBeenCalledWith({
			type: 'openLink',
			href: './notes.md',
		})
		expect(windowOpen).not.toHaveBeenCalled()
	})

	it('scrolls to the matching heading for a same-document hash link, with no host message', () => {
		const postMessage = bootInsideVSCode()
		const editor = createEditor('# Title\n\n[Jump](#title)\n\n## Second\n', {
			mount: true,
		})
		const heading = editor.view.dom.querySelector('h1')!
		const scrollIntoView = vi.fn()
		heading.scrollIntoView = scrollIntoView

		click(editor.view.dom.querySelector('a')!)

		expect(scrollIntoView).toHaveBeenCalled()
		expect(postMessage).not.toHaveBeenCalled()
	})

	it('scrolls to the matching heading when the hash differs from the slug only in case', () => {
		const postMessage = bootInsideVSCode()
		const editor = createEditor(
			'# Getting Started\n\n[Jump](#Getting-Started)\n',
			{ mount: true }
		)
		const heading = editor.view.dom.querySelector('h1')!
		const scrollIntoView = vi.fn()
		heading.scrollIntoView = scrollIntoView

		click(editor.view.dom.querySelector('a')!)

		expect(scrollIntoView).toHaveBeenCalled()
		expect(postMessage).not.toHaveBeenCalled()
	})

	it('does nothing for a hash with no matching heading', () => {
		const postMessage = bootInsideVSCode()
		const editor = createEditor('# Title\n\n[Jump](#missing)\n', {
			mount: true,
		})

		expect(() => click(editor.view.dom.querySelector('a')!)).not.toThrow()
		expect(postMessage).not.toHaveBeenCalled()
	})
})
