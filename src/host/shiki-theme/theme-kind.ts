import * as vscode from 'vscode'

import type { ShikiThemeKind } from '../../shared/messages'

const UI_THEME_KIND: Record<string, ShikiThemeKind> = {
	vs: 'light',
	'vs-dark': 'dark',
	'hc-black': 'high-contrast',
	'hc-light': 'high-contrast-light',
}

const COLOR_THEME_KIND: Record<vscode.ColorThemeKind, ShikiThemeKind> = {
	[vscode.ColorThemeKind.Light]: 'light',
	[vscode.ColorThemeKind.Dark]: 'dark',
	[vscode.ColorThemeKind.HighContrast]: 'high-contrast',
	[vscode.ColorThemeKind.HighContrastLight]: 'high-contrast-light',
}

/** A theme contribution's `uiTheme` field, reshaped to `ShikiThemeKind`. */
export function kindFromUiTheme(uiTheme: string): ShikiThemeKind | undefined {
	return UI_THEME_KIND[uiTheme]
}

/** VS Code's own read of light/dark/high-contrast, used when a theme's
 *  contribution is missing or unreadable and there is nothing more specific
 *  to fall back to. */
export function fallbackKind(): ShikiThemeKind {
	return COLOR_THEME_KIND[vscode.window.activeColorTheme.kind]
}
