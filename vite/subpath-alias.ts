/** Resolves `#src/*` for Rollup/Rolldown, which doesn't read `package.json`'s `imports` field on its own. */
export function subpathAlias(): { find: RegExp; replacement: string }[] {
	return [{ find: /^#src\//, replacement: `${import.meta.dirname}/../src/` }]
}
