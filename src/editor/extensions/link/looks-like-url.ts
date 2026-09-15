const URL_PATTERN = /^https?:\/\/\S*[^\s.,;:!?)\]}'"]$/

export function looksLikeUrl(text: string): boolean {
	const trimmed = text.trim()
	if (!trimmed) return false
	return URL_PATTERN.test(trimmed)
}
