const URL_PATTERN = /^https?:\/\/\S+$/

export function looksLikeUrl(text: string): boolean {
	return URL_PATTERN.test(text.trim())
}
