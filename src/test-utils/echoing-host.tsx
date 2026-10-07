import { render, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'

import { SettingsProvider } from '#src/components/settings-provider'
import { LIVE_EDITOR_ID } from '#src/editor/editor-mode-live-surface'
import Layout from '#src/layout'

const pendingEchoes = new Set<ReturnType<typeof setTimeout>>()

export type Transform = (content: string) => string

/** Every `syncDocument` the page sent, latest last. */
export function syncedTexts(postMessage: {
	mock: { calls: unknown[][] }
}): string[] {
	return postMessage.mock.calls
		.map((call) => call[0])
		.filter(
			(message): message is { type: 'syncDocument'; content: string } =>
				typeof message === 'object' &&
				message !== null &&
				'type' in message &&
				message.type === 'syncDocument'
		)
		.map((message) => message.content)
}

/**
 * Mounts the app as VS Code would, with a host that answers every sync the way
 * a real one can: the text comes back as an `update`, touched up by
 * `transform` - a save hook, a formatter, CRLF line endings.
 */
export function mountWithEchoingHost(note: string, transform: Transform) {
	const postMessage = vi.fn((message: unknown) => {
		if (
			typeof message !== 'object' ||
			message === null ||
			!('type' in message) ||
			message.type !== 'syncDocument' ||
			!('content' in message) ||
			typeof message.content !== 'string'
		) {
			return
		}
		const echoed = transform(message.content)
		const echo = setTimeout(() => {
			pendingEchoes.delete(echo)
			window.dispatchEvent(
				new MessageEvent('message', {
					data: { type: 'update', content: echoed, fileName: 'notes.md' },
				})
			)
		}, 50)
		pendingEchoes.add(echo)
	})
	window.vscode = { postMessage, getState: vi.fn(), setState: vi.fn() }
	window.initialContent = note
	window.fileName = 'notes.md'

	render(
		<SettingsProvider>
			<Layout defaultFileName="notes.md" />
		</SettingsProvider>
	)
	return postMessage
}

export function liveEditor(): HTMLElement {
	return document.getElementById(LIVE_EDITOR_ID) as HTMLElement
}

export const pause = (ms: number) =>
	new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Puts the caret at the end of `text`'s paragraph, the way a click would if
 * happy-dom laid anything out - ProseMirror reads it back off the DOM
 * selection.
 */
export async function placeCaretAfter(text: string) {
	const user = userEvent.setup()
	const element = await within(liveEditor()).findByText(text)
	await user.click(element)
	const node = element.firstChild
	if (!(node instanceof Text)) throw new Error(`No text node in "${text}"`)
	document.getSelection()?.collapse(node, node.length)
	document.dispatchEvent(new Event('selectionchange'))
	await pause(50)
}

/** Drops any echo still in flight, which would land in the next test's editor. */
export function cancelPendingEchoes() {
	pendingEchoes.forEach(clearTimeout)
	pendingEchoes.clear()
}
