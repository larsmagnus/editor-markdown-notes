import * as vscode from 'vscode'

import type { Logger } from '../shared/logger'
import type { ShikiThemePayload } from '../shared/messages'

import { extractShikiTheme } from './shiki-theme/extract-theme'
import { resolveActiveThemeSettingsId } from './shiki-theme/resolve-active-theme-id'

/** What `resolveActiveThemeSettingsId` reads, watched for changes below. */
const COLOR_THEME_SETTING = 'workbench.colorTheme'

/**
 * Caches the active VS Code color theme's extraction by `settingsId`, since
 * re-reading and re-merging its `include` chain off disk on every request
 * would be wasted work between theme switches.
 */
export class ShikiThemeStore {
	private readonly log: Logger
	private cache?: { settingsId: string; payload: ShikiThemePayload }

	constructor(log: Logger) {
		this.log = log
	}

	public getTheme(): ShikiThemePayload {
		const settingsId = resolveActiveThemeSettingsId()
		if (this.cache?.settingsId === settingsId) return this.cache.payload

		const payload = extractShikiTheme(settingsId, this.log)
		this.cache = { settingsId, payload }
		return payload
	}

	/**
	 * Calls `listener` when the active theme changes to a different one.
	 *
	 * Two sources, because neither alone is enough:
	 * `onDidChangeActiveColorTheme` carries only a `kind`, so it is the wrong
	 * shape for noticing a switch between two themes of the same kind, and the
	 * setting is what the extraction actually reads. Both firing for one switch
	 * is why the settings id is compared against the cache first - otherwise a
	 * single theme change costs every open panel two re-highlights.
	 */
	public onDidChangeTheme(listener: () => void): vscode.Disposable {
		const notifyIfChanged = () => {
			if (this.cache?.settingsId === resolveActiveThemeSettingsId()) return
			listener()
		}

		return vscode.Disposable.from(
			vscode.window.onDidChangeActiveColorTheme(notifyIfChanged),
			vscode.workspace.onDidChangeConfiguration((event) => {
				if (event.affectsConfiguration(COLOR_THEME_SETTING)) notifyIfChanged()
			})
		)
	}
}
