import * as fs from 'fs'
import * as path from 'path'

import * as vscode from 'vscode'

import type { Logger } from '../../shared/logger'
import type { ShikiThemePayload } from '../../shared/messages'

import { findThemeContribution } from './find-theme-contribution'
import { resolveThemeJson } from './resolve-theme-json'
import { fallbackKind, kindFromUiTheme } from './theme-kind'

/**
 * Extracts one VS Code color theme's JSON, reshaped for Shiki.
 *
 * Never throws - any failure (theme extension not found, file unreadable,
 * malformed JSON) logs and degrades to `raw: null`, which the webview reads as
 * "fall back to the bundled theme" for `kind`.
 */
export function extractShikiTheme(
	settingsId: string,
	log: Logger
): ShikiThemePayload {
	try {
		const contribution = findThemeContribution(
			vscode.extensions.all,
			settingsId
		)

		if (!contribution) {
			log.warn(`No installed extension contributes the theme "${settingsId}"`)
			return { themeId: settingsId, kind: fallbackKind(), raw: null }
		}

		return {
			themeId: settingsId,
			kind: kindFromUiTheme(contribution.uiTheme) ?? fallbackKind(),
			raw: readThemeJson(contribution),
		}
	} catch (error) {
		log.warn(`Failed to extract the theme "${settingsId}": ${String(error)}`)
		return { themeId: settingsId, kind: fallbackKind(), raw: null }
	}
}

function readThemeJson(contribution: {
	extensionPath: string
	themePath: string
}) {
	const themePath = path.join(
		contribution.extensionPath,
		contribution.themePath
	)
	return resolveThemeJson(themePath, (filePath) =>
		fs.readFileSync(filePath, 'utf8')
	)
}
