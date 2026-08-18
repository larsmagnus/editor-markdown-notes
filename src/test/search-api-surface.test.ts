import * as assert from 'assert'

import * as vscode from 'vscode'

/**
 * What this VSCode build actually exposes, as opposed to what `vscode.d.ts`
 * declares. The typings are hand-maintained and the app ships a newer runtime
 * than `@types/vscode` pins, so "absent from the types" is not the same finding
 * as "absent from the runtime".
 *
 * Temporary, alongside `reveal-probe.ts`.
 */
suite('Search reveal API surface', () => {
	test('lists the internal commands the public list hides', async () => {
		// `getCommands(true)` filters internal commands out. Anything that reads
		// the search view's state without a clipboard round-trip would live here.
		const all = await vscode.commands.getCommands(false)
		const publicOnly = new Set(await vscode.commands.getCommands(true))

		const internal = all
			.filter((command) => !publicOnly.has(command))
			.filter((command) =>
				/search|result|match|reveal|selection/i.test(command)
			)
			.sort()

		console.log(`\n===== ${internal.length} internal search commands =====`)
		for (const command of internal) console.log(`  ${command}`)
		console.log('===== end internal commands =====\n')

		assert.ok(all.length > publicOnly.size, 'expected some internal commands')
	})

	test('lists runtime namespace members', () => {
		console.log(`\n===== vscode ${vscode.version} namespace members =====`)
		for (const name of ['window', 'workspace', 'commands', 'env'] as const) {
			const keys = Object.keys(vscode[name] as unknown as object).sort()
			console.log(`  vscode.${name}: ${keys.join(', ')}`)
		}
		console.log('===== end namespace members =====\n')

		assert.ok(vscode.version, 'expected a runtime version')
	})
})
