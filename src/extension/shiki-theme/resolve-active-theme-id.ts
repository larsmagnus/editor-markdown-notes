import * as vscode from 'vscode'

/**
 * The id `workbench.colorTheme` is stored under - a theme's declared `id` if
 * it has one, else its `label`. `findThemeContribution` replicates that same
 * precedence when matching an installed extension's contribution against it.
 */
export function resolveActiveThemeSettingsId(): string {
	return (
		vscode.workspace.getConfiguration().get<string>('workbench.colorTheme') ??
		''
	)
}
