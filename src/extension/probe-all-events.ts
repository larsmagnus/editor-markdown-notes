import * as vscode from 'vscode'

import { describe } from './reveal-probe-describe'

/**
 * Subscribes to every event the runtime exposes, not a hand-picked few.
 *
 * Hand-picking is what made the earlier "a reveal fires nothing" reading
 * untrustworthy: it can only ever confirm that the events someone thought of
 * did not fire. Enumerating `onDid*` off the namespace objects covers the ones
 * nobody thought of, including any absent from `vscode.d.ts`.
 */

export interface FiredEvent {
	readonly at: number
	readonly source: string
	readonly detail: string
}

type EventLike = (listener: (value: unknown) => void) => vscode.Disposable

/**
 * Hooks every `onDid*` on the given namespaces, recording each firing into
 * `fired`. Events gated behind an API proposal throw on subscribe and are
 * reported as skipped rather than taken as absent.
 */
export function subscribeToEveryEvent(fired: FiredEvent[]): {
	dispose: () => void
	hooked: string[]
	skipped: string[]
} {
	const startedAt = Date.now()
	const disposables: vscode.Disposable[] = []
	const hooked: string[] = []
	const skipped: string[] = []

	const namespaces: Record<string, object> = {
		window: vscode.window,
		workspace: vscode.workspace,
		'window.tabGroups': vscode.window.tabGroups,
		env: vscode.env,
	}

	for (const [namespaceName, namespace] of Object.entries(namespaces)) {
		for (const key of Object.keys(namespace)) {
			if (!key.startsWith('onDid') && !key.startsWith('onWill')) continue

			const source = `${namespaceName}.${key}`
			try {
				const event = (namespace as Record<string, unknown>)[key] as EventLike
				disposables.push(
					event((value) => {
						fired.push({
							at: Date.now() - startedAt,
							source,
							detail: describe(value).slice(0, 200),
						})
					})
				)
				hooked.push(source)
			} catch (error) {
				skipped.push(`${source} (${String(error).slice(0, 60)})`)
			}
		}
	}

	return {
		dispose: () => disposables.forEach((one) => one.dispose()),
		hooked,
		skipped,
	}
}
