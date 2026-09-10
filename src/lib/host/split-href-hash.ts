/**
 * Splits a link's href on its first `#` into a path and hash - shared by the
 * webview's `resolve-link-href.ts` and the host's `resolve-link-target.ts`/
 * `open-link-command.ts` since `tsconfig.host.json` only includes
 * `src/lib/host/**`, not the general `src/lib/` tree (which drags in zod,
 * React, the retext stack). Same carve-out as `frontmatter.ts`'s split.
 */
export function splitHrefHash(href: string): { path: string; hash: string } {
	const index = href.indexOf('#')
	if (index === -1) return { path: href, hash: '' }

	return { path: href.slice(0, index), hash: href.slice(index + 1) }
}
