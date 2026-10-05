const RELATIVE_TIME_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
	['year', 365 * 24 * 60 * 60 * 1000],
	['month', 30 * 24 * 60 * 60 * 1000],
	['week', 7 * 24 * 60 * 60 * 1000],
	['day', 24 * 60 * 60 * 1000],
	['hour', 60 * 60 * 1000],
	['minute', 60 * 1000],
]

const relativeTime = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

/** The short and frequent units, shortened so a card's one line has room for them. */
const UNIT_ABBREVIATIONS: [RegExp, string][] = [
	[/\bseconds?\b/, 'sec'],
	[/\bminutes?\b/, 'min'],
]

/** "3 days ago", in the largest unit that fits; seconds and minutes abbreviated. */
export function formatRelativeTime(timestamp: number, now: number): string {
	const elapsed = timestamp - now
	const [unit, size] = RELATIVE_TIME_UNITS.find(
		([, unitSize]) => Math.abs(elapsed) >= unitSize
	) ?? ['second', 1000]
	const phrase = relativeTime.format(Math.round(elapsed / size), unit)

	return UNIT_ABBREVIATIONS.reduce(
		(text, [unitName, abbreviation]) => text.replace(unitName, abbreviation),
		phrase
	)
}

const SIZE_UNITS = ['B', 'KB', 'MB', 'GB']

/** Binary units, one decimal place from KB up: "3.3 MB". */
export function formatFileSize(bytes: number): string {
	const exponent = Math.min(
		Math.floor(Math.log(Math.max(bytes, 1)) / Math.log(1024)),
		SIZE_UNITS.length - 1
	)
	const value = bytes / 1024 ** exponent

	return `${exponent === 0 ? value : value.toFixed(1)} ${SIZE_UNITS[exponent]}`
}

/** "1,234 chars", grouped in the reader's locale. */
export function formatCount(count: number, unit: string): string {
	return `${count.toLocaleString()} ${unit}`
}
