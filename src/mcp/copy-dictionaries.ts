import { copyFileSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'

import { DICTIONARIES } from '@/mcp/dictionaries'

/**
 * Copies the Hunspell dictionaries somewhere the MCP server can read them.
 *
 * The `dictionary-*` packages hide their `.aff`/`.dic` behind a bare-string
 * `exports`, so the files are found next to the resolved entry rather than by
 * a subpath import - the same thing `dictionaryAliases()` in `vite.config.ts`
 * does for the webview build.
 *
 * Exported as well as run, so the unit tests populate a scratch directory
 * through the same code the build uses rather than a second copy of it. Build
 * time only: the packaged extension has no `node_modules` to resolve against,
 * and by then the files are already sitting beside the server.
 */
export function copyDictionaries(target: string): string {
	const require = createRequire(import.meta.url)
	mkdirSync(target, { recursive: true })

	for (const { basename, package: packageName } of Object.values(
		DICTIONARIES
	)) {
		const source = dirname(require.resolve(packageName))
		copyFileSync(join(source, 'index.aff'), join(target, `${basename}.aff`))
		copyFileSync(join(source, 'index.dic'), join(target, `${basename}.dic`))
	}

	return target
}

const entry = process.argv[1]
if (entry && import.meta.url === pathToFileURL(entry).href) {
	const target = copyDictionaries('out/mcp/dictionaries')
	console.log(
		`Copied ${Object.keys(DICTIONARIES).length} dictionaries to ${target}`
	)
}
