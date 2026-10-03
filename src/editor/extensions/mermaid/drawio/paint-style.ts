const RGB = /^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/
const SHORT_HEX = /^#([\da-f])([\da-f])([\da-f])$/i
const LONG_HEX = /^#[\da-f]{6}$/i

function hex(channel: number) {
	return channel.toString(16).padStart(2, '0')
}

/** Normalises the forms a browser reports a colour in; undefined if unknown. */
function toHexColor(value: string) {
	const color = value.trim()
	if (color === 'none') return 'none'
	if (LONG_HEX.test(color)) return color.toLowerCase()
	const short = SHORT_HEX.exec(color)
	if (short)
		return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`.toLowerCase()
	const rgb = RGB.exec(color)
	if (rgb)
		return `#${hex(Number(rgb[1]))}${hex(Number(rgb[2]))}${hex(Number(rgb[3]))}`
	return undefined
}

/** A wrapper group is painted by the paths inside it, not by itself. */
function paintedElement(shape: Element) {
	return shape.tagName.toLowerCase() === 'g'
		? (shape.querySelector('path') ?? shape)
		: shape
}

function entry(key: string, value: string | undefined) {
	return value === undefined ? [] : [`${key}=${value}`]
}

/**
 * The stroke colour and width a diagram's stylesheet and the author's own
 * styling resolve to. Mermaid paints through the cascade, so only a computed
 * style sees the end result.
 */
export function strokeStyle(shape: Element) {
	const computed = getComputedStyle(paintedElement(shape))
	const width = Number.parseFloat(computed.strokeWidth)
	return [
		...entry('strokeColor', toHexColor(computed.stroke)),
		...entry('strokeWidth', Number.isFinite(width) ? String(width) : undefined),
	].join(';')
}

/** The fill colour a shape resolves to. */
export function fillStyle(shape: Element) {
	const computed = getComputedStyle(paintedElement(shape))
	return entry('fillColor', toHexColor(computed.fill)).join(';')
}
