import * as vscode from 'vscode'

/**
 * Serialization for the reveal probe: turns VSCode API objects into strings a
 * log line can carry.
 *
 * `JSON.stringify` on a `Uri` or `Range` yields either noise or nothing, and a
 * probe that silently drops the one field that mattered is worse than no probe.
 *
 * Temporary, alongside `reveal-probe.ts`.
 */

function replacer(_key: string, value: unknown): unknown {
	if (value instanceof vscode.Uri) return `Uri(${value.toString()})`
	if (value instanceof vscode.Selection) {
		return `Selection(${value.anchor.line},${value.anchor.character}->${value.active.line},${value.active.character})`
	}
	if (value instanceof vscode.Range) {
		return `Range(${value.start.line},${value.start.character}-${value.end.line},${value.end.character})`
	}
	if (value instanceof vscode.Position) {
		return `Position(${value.line},${value.character})`
	}
	if (typeof value === 'function') return '[function]'
	return value
}

export function describe(data: unknown): string {
	try {
		return JSON.stringify(data, replacer) ?? String(data)
	} catch (error) {
		return `[unserializable: ${String(error)}]`
	}
}

/**
 * Every own and inherited key of an API object, with values inlined.
 *
 * The point is to catch a property `vscode.d.ts` does not declare - the typings
 * are hand-maintained and have lagged the runtime before, so "not in the types"
 * is not the same finding as "not on the object".
 */
export function reflect(target: object): Record<string, string> {
	const seen: Record<string, string> = {}

	for (
		let current: object | null = target;
		current && current !== Object.prototype;
		current = Object.getPrototypeOf(current)
	) {
		for (const key of Object.getOwnPropertyNames(current)) {
			if (key in seen || key === 'constructor') continue
			seen[key] = readKey(target, key)
		}
	}

	return seen
}

function readKey(target: object, key: string): string {
	try {
		const value = (target as Record<string, unknown>)[key]
		if (value && typeof value === 'object') {
			return `${value.constructor?.name ?? 'object'} ${describe(value)}`
		}

		return describe(value)
	} catch (error) {
		return `[threw: ${String(error)}]`
	}
}

export function describeEditor(editor: vscode.TextEditor | undefined) {
	if (!editor) return undefined

	return {
		uri: editor.document.uri,
		viewColumn: editor.viewColumn,
		selections: editor.selections,
		visibleRanges: editor.visibleRanges,
	}
}

export function describeTabInput(input: unknown) {
	if (input instanceof vscode.TabInputText) {
		return { kind: 'TabInputText', uri: input.uri }
	}

	if (input instanceof vscode.TabInputCustom) {
		return {
			kind: 'TabInputCustom',
			uri: input.uri,
			viewType: input.viewType,
			// Reflected rather than typed: if VSCode ever attaches the requested
			// selection to the tab input, this is where it would surface.
			properties: reflect(input),
		}
	}

	return { kind: input?.constructor?.name ?? typeof input }
}

/** A snapshot of every editor-ish surface, for correlating against an open. */
export function snapshotWorkbench() {
	return {
		activeTextEditor: describeEditor(vscode.window.activeTextEditor),
		visibleTextEditors: vscode.window.visibleTextEditors.map(describeEditor),
		tabs: vscode.window.tabGroups.all.flatMap((group) =>
			group.tabs.map((tab) => ({
				label: tab.label,
				isActive: tab.isActive,
				isPreview: tab.isPreview,
				group: group.viewColumn,
				input: describeTabInput(tab.input),
			}))
		),
	}
}
