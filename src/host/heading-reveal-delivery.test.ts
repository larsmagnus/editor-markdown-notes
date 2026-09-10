import { describe, expect, it, vi } from 'vitest'
import type * as vscode from 'vscode'

import { deliverHeadingReveal } from '#src/host/heading-reveal-delivery'
import { PendingHeadingRevealStore } from '#src/host/pending-heading-reveal-store'
import { SessionsByUri } from '#src/host/sessions-by-uri'

function fakeUri(value: string): vscode.Uri {
	return { toString: () => value } as vscode.Uri
}

function fakePanel(): {
	panel: vscode.WebviewPanel
	postMessage: ReturnType<typeof vi.fn>
} {
	const postMessage = vi.fn()
	const panel = { webview: { postMessage } } as unknown as vscode.WebviewPanel
	return { panel, postMessage }
}

describe('deliverHeadingReveal', () => {
	it('posts revealHeading to every open panel for the uri', () => {
		const uri = fakeUri('file:///open.md')
		const panelsByUri = new SessionsByUri<vscode.WebviewPanel>()
		const pendingReveals = new PendingHeadingRevealStore()
		const first = fakePanel()
		const second = fakePanel()
		panelsByUri.add(uri.toString(), first.panel)
		panelsByUri.add(uri.toString(), second.panel)

		deliverHeadingReveal(uri, 'title', panelsByUri, pendingReveals)

		expect(first.postMessage).toHaveBeenCalledWith({
			type: 'revealHeading',
			hash: 'title',
		})
		expect(second.postMessage).toHaveBeenCalledWith({
			type: 'revealHeading',
			hash: 'title',
		})
	})

	it('records a pending reveal when no panel is open for the uri', () => {
		const uri = fakeUri('file:///not-open.md')
		const panelsByUri = new SessionsByUri<vscode.WebviewPanel>()
		const pendingReveals = new PendingHeadingRevealStore()

		deliverHeadingReveal(uri, 'title', panelsByUri, pendingReveals)

		expect(pendingReveals.take(uri)).toEqual({ hash: 'title' })
	})
})
