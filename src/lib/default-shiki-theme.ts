import type { ThemeRegistrationRaw } from 'shiki'

/**
 * The theme used before the host's live VS Code theme arrives, whenever that
 * theme is the wrong side of the light/dark toggle, and permanently in the
 * standalone web build, which never requests one.
 *
 * One dynamic import per side rather than two static ones, so a note only ever
 * pays for the side it is showing.
 */
export async function loadDefaultShikiTheme(
	dark: boolean
): Promise<ThemeRegistrationRaw> {
	const theme = dark
		? await import('@shikijs/themes/github-dark')
		: await import('@shikijs/themes/github-light')

	return theme.default as ThemeRegistrationRaw
}
