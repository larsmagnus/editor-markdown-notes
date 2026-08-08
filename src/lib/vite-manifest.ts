/** The subset of a Vite manifest entry the host reads. */
export type ViteManifestChunk = {
	file?: string
	css?: string[]
	imports?: string[]
}

export type EntryChunk = {
	/** Entry chunk path, relative to `dist/`. */
	file: string
	/** Stylesheets from the entry and everything it imports. */
	css: string[]
	/** Chunks reachable from the entry by static import, relative to `dist/`. */
	imports: string[]
}

/**
 * Locates the built entry chunk in a Vite manifest. The file names carry
 * content hashes and the code-split chunks are named after their modules, so
 * there is nothing stable to match on by hand.
 *
 * Takes a parsed manifest rather than a path so it stays free of both `fs` and
 * `vscode`, which is what makes it testable outside the extension host.
 */
export function resolveEntryChunk(
	manifest: Record<string, ViteManifestChunk>
): EntryChunk | undefined {
	const entry = manifest['index.html']
	if (!entry?.file) return undefined

	// A chunk's stylesheets hang off that chunk, so collecting only the entry's
	// would leave anything a vendor chunk brings with it unstyled. The graph is
	// walked in full because an imported chunk may import further chunks, and
	// `seen` also stops a cycle between two chunks from recursing forever.
	const imports: string[] = []
	const css = [...(entry.css ?? [])]
	const seen = new Set<string>()

	const collect = (keys: string[] = []) => {
		for (const key of keys) {
			if (seen.has(key)) continue
			seen.add(key)

			const chunk = manifest[key]
			if (!chunk?.file) continue

			imports.push(chunk.file)
			css.push(...(chunk.css ?? []))
			collect(chunk.imports)
		}
	}

	collect(entry.imports)

	return { file: entry.file, css, imports }
}
