import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { WORKSPACE_SEPARATOR } from '@/shared/constants'
import { DEFAULT_VIEW_OPTIONS } from '@/shared/messages'

/**
 * The host's configuration reaches this process as environment variables, read
 * once at import. Each case therefore loads the module afresh with the
 * environment it is about, rather than mutating a live one.
 */
async function loadWith(environment: Record<string, string>) {
	vi.resetModules()
	for (const [key, value] of Object.entries(environment)) {
		vi.stubEnv(key, value)
	}

	return import('@/mcp/environment')
}

/** A workspace folder holding one note, as a real directory on disk. */
function folderWith(name: string, body: string): string {
	const folder = mkdtempSync(join(tmpdir(), 'emn-workspace-'))
	mkdirSync(folder, { recursive: true })
	writeFileSync(join(folder, name), body, 'utf8')

	return folder
}

afterEach(() => {
	vi.unstubAllEnvs()
})

describe('enabled checks', () => {
	it('uses the checks the panel has switched on', async () => {
		const { defaults } = await loadWith({ EMN_RULES: 'passive,spelling' })

		expect(defaults.rules).toEqual(['passive', 'spelling'])
	})

	it('falls back to the defaults when every check is switched off', async () => {
		// An empty report would otherwise read to an agent as "this note is
		// clean" rather than "nothing was checked".
		const { defaults } = await loadWith({ EMN_RULES: '' })

		expect(defaults.rules).toEqual(DEFAULT_VIEW_OPTIONS.textToolRules)
	})

	it('falls back to the defaults when the list is not a set of rule ids', async () => {
		const { defaults } = await loadWith({ EMN_RULES: 'passive,nonsense' })

		expect(defaults.rules).toEqual(DEFAULT_VIEW_OPTIONS.textToolRules)
	})
})

describe('reading a note', () => {
	it('resolves a relative path against a workspace folder', async () => {
		const docs = folderWith('note.md', 'First root.\n')
		const { readSource } = await loadWith({ EMN_WORKSPACE: docs })

		expect(readSource({ path: 'note.md' })).toBe('First root.\n')
	})

	it('resolves against a later folder in a multi-root workspace', async () => {
		const docs = folderWith('other.md', 'First root.\n')
		const site = folderWith('note.md', 'Second root.\n')
		const { readSource } = await loadWith({
			EMN_WORKSPACE: [docs, site].join(WORKSPACE_SEPARATOR),
		})

		expect(readSource({ path: 'note.md' })).toBe('Second root.\n')
	})

	it('names every folder it tried when the note is nowhere', async () => {
		const docs = folderWith('a.md', 'a\n')
		const site = folderWith('b.md', 'b\n')
		const { readSource } = await loadWith({
			EMN_WORKSPACE: [docs, site].join(WORKSPACE_SEPARATOR),
		})

		expect(() => readSource({ path: 'missing.md' })).toThrow(
			new RegExp(`Tried it against.*${docs}.*${site}`, 's')
		)
	})

	it('checks text handed over directly, with no file involved', async () => {
		const { readSource } = await loadWith({})

		expect(readSource({ text: 'Inline draft.\n' })).toBe('Inline draft.\n')
	})

	it('says what is missing when given neither a path nor text', async () => {
		const { readSource } = await loadWith({})

		expect(() => readSource({})).toThrow(/Provide either a `path`/)
	})
})
