/**
 * Converts a string into a URL-friendly slug.
 * @param input - The input string to be converted into a slug.
 * @returns The slugified string.
 */
export function toSlug(value?: string | number): string {
	return String(value)
		.toLowerCase() // Convert to lowercase
		.replace(/\.mdx$/, '') // Remove mdx file extension
		.replaceAll(' ', '-')
		.replace(/[^a-z0-9-]/g, '') // Allow only a-z, 0-9, and dashes
		.replaceAll('--', '-') // Replace multiple dashes with a single dash
		.replaceAll(/^-+|-+$/g, '') // Remove leading and trailing dashes
}

/**
 * Converts a slug, filename or other into a human-readable string.
 * @param slug - The slug to be converted back to a string.
 * @returns The human-readable string.
 */
export function toTitle(value: string | number): string {
	return String(value)
		.replace(/\.mdx$/, '')
		.replaceAll('-', ' ') // Replace dashes with spaces
		.replaceAll(/\b\w/g, (char) => char.toUpperCase()) // Capitalize first letter of each word
}
