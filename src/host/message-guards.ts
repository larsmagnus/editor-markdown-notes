/**
 * Narrows an unknown `postMessage` payload to one carrying this `type` tag.
 *
 * Checks only the tag, not the rest of the shape - the channel is typed at
 * both ends already, so a caller's own type predicate can safely claim the
 * remaining fields without this repeating that validation for each message.
 */
export function hasMessageType<T extends string>(
	message: unknown,
	type: T
): message is { type: T } {
	return (
		typeof message === 'object' &&
		message !== null &&
		'type' in message &&
		message.type === type
	)
}
