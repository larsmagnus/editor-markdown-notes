import { describe, expect, it } from 'vitest'
import type * as vscode from 'vscode'

import { PanelRegistry } from '#src/host/panel-registry'

function fakePanel(): vscode.WebviewPanel {
	return {} as vscode.WebviewPanel
}

describe('PanelRegistry', () => {
	it('tracks a ready panel in both the plain set and the uri-keyed one', () => {
		const registry = new PanelRegistry()
		const panel = fakePanel()

		registry.track('file:///notes.md', panel, true)

		expect(registry.panels.has(panel)).toBe(true)
		expect(registry.panelsByUri.get('file:///notes.md')?.has(panel)).toBe(true)
	})

	it('tracks a not-ready panel in the plain set only', () => {
		const registry = new PanelRegistry()
		const panel = fakePanel()

		registry.track('file:///notes.md', panel, false)

		expect(registry.panels.has(panel)).toBe(true)
		expect(registry.panelsByUri.get('file:///notes.md')).toBeUndefined()
	})

	it('removes a panel from both on untrack', () => {
		const registry = new PanelRegistry()
		const panel = fakePanel()
		registry.track('file:///notes.md', panel, true)

		registry.untrack('file:///notes.md', panel)

		expect(registry.panels.has(panel)).toBe(false)
		expect(registry.panelsByUri.get('file:///notes.md')).toBeUndefined()
	})
})
