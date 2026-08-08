export function isWordChar(char: string | undefined): boolean {
	return char !== undefined && /\w/.test(char)
}
