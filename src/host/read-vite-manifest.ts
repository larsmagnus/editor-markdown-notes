import * as fs from 'fs'
import * as path from 'path'

import { resolveEntryChunk } from '../lib/host/vite-manifest'
import type { EntryChunk, ViteManifestChunk } from '../lib/host/vite-manifest'
import type { Logger } from '../shared/logger'

/**
 * The built entry chunk, found through the manifest `pnpm build` writes into
 * `dist/`. Without it there is nothing to load, so both failure paths say so.
 *
 * The manifest is parsed by hand rather than validated with zod: the `.vsix` is
 * packaged with `--no-dependencies`, so the host cannot require anything at
 * runtime.
 */
export function readEntryChunk(
	distPath: string,
	log: Logger
): EntryChunk | undefined {
	let manifest: Record<string, ViteManifestChunk>

	try {
		manifest = JSON.parse(
			fs.readFileSync(path.join(distPath, 'manifest.json'), 'utf8')
		)
	} catch (error) {
		log.error(`Failed to read the Vite manifest: ${String(error)}`)
		return undefined
	}

	const entry = resolveEntryChunk(manifest)
	if (!entry) log.error('The Vite manifest has no index.html entry')

	return entry
}
