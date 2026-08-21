/**
 * Which installed extension contributes the active color theme, and where its
 * JSON lives on disk.
 *
 * Pure and vscode-free on purpose, so the matching logic (in particular the
 * `id ?? label` precedence VS Code itself uses for `workbench.colorTheme`'s
 * stored value) is testable under vitest without mocking the `vscode` module.
 */

type ThemeContributionEntry = {
	id?: string
	label: string
	path: string
	uiTheme: 'vs' | 'vs-dark' | 'hc-black' | 'hc-light'
}

export type ThemeExtensionLike = {
	extensionPath: string
	packageJSON: { contributes?: { themes?: ThemeContributionEntry[] } }
}

export type ThemeContribution = {
	extensionPath: string
	themePath: string
	uiTheme: ThemeContributionEntry['uiTheme']
}

export function findThemeContribution(
	extensions: readonly ThemeExtensionLike[],
	settingsId: string
): ThemeContribution | undefined {
	for (const extension of extensions) {
		const themes = extension.packageJSON.contributes?.themes ?? []
		const match = themes.find(
			(theme) => (theme.id ?? theme.label) === settingsId
		)

		if (match) {
			return {
				extensionPath: extension.extensionPath,
				themePath: match.path,
				uiTheme: match.uiTheme,
			}
		}
	}

	return undefined
}
