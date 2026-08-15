import * as vscode from 'vscode'

import {
	CLAUDE_PROMPT_TEMPLATE_MAX_LENGTH,
	DEFAULT_SETTINGS,
	DEFAULT_VIEW_OPTIONS,
} from '../shared/messages'
import type {
	Config,
	ExtensionSettings,
	ItalicMarker,
	ViewOptions,
} from '../shared/messages'

import { CONFIG_SECTION, VIEW_OPTIONS_KEY } from './constants'

/**
 * The two halves of the editor's configuration, and the only thing that reads
 * or writes either.
 *
 * `settings` are workspace/user configuration, owned by VSCode; `viewOptions`
 * are the toolbar's own toggles, persisted in `globalState` so every tab and
 * every window agrees.
 */
export class SettingsStore {
	private readonly context: vscode.ExtensionContext

	constructor(context: vscode.ExtensionContext) {
		this.context = context
	}

	public getViewOptions(): ViewOptions {
		return {
			...DEFAULT_VIEW_OPTIONS,
			...this.context.globalState.get<Partial<ViewOptions>>(VIEW_OPTIONS_KEY),
		}
	}

	public async updateViewOptions(patch: Partial<ViewOptions>) {
		await this.context.globalState.update(VIEW_OPTIONS_KEY, {
			...this.getViewOptions(),
			...patch,
		})
	}

	/**
	 * Manifest defaults apply automatically; `DEFAULT_SETTINGS` only backstops
	 * a key missing from `contributes.configuration` entirely.
	 */
	public getSettings(): ExtensionSettings {
		const config = vscode.workspace.getConfiguration(CONFIG_SECTION)

		return {
			centerContent: config.get<boolean>(
				'centerContent',
				DEFAULT_SETTINGS.centerContent
			),
			hideToolbar: config.get<boolean>(
				'hideToolbar',
				DEFAULT_SETTINGS.hideToolbar
			),
			textToolsTargetAge: config.get<number>(
				'textToolsTargetAge',
				DEFAULT_SETTINGS.textToolsTargetAge
			),
			italicMarker: config.get<ItalicMarker>(
				'italicMarker',
				DEFAULT_SETTINGS.italicMarker
			),
			// `maxLength` in package.json only validates settings.json edits made
			// through the Settings UI - clamped again here since a value typed
			// directly into settings.json isn't blocked from exceeding it.
			claudePromptTemplate: config
				.get<string>(
					'claudePromptTemplate',
					DEFAULT_SETTINGS.claudePromptTemplate
				)
				.slice(0, CLAUDE_PROMPT_TEMPLATE_MAX_LENGTH),
			claudeInlinePromptTemplate: config
				.get<string>(
					'claudeInlinePromptTemplate',
					DEFAULT_SETTINGS.claudeInlinePromptTemplate
				)
				.slice(0, CLAUDE_PROMPT_TEMPLATE_MAX_LENGTH),
			imageCopyDirectory: config.get<string>(
				'imageCopyDirectory',
				DEFAULT_SETTINGS.imageCopyDirectory
			),
		}
	}

	public getConfig(): Config {
		return {
			settings: this.getSettings(),
			viewOptions: this.getViewOptions(),
		}
	}
}
