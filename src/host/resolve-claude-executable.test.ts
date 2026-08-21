import { afterEach, describe, expect, it, vi } from 'vitest'

const execFile = vi.hoisted(() => vi.fn())
vi.mock('node:child_process', () => ({ execFile, default: { execFile } }))

afterEach(() => {
	vi.resetModules()
	vi.clearAllMocks()
})

describe('resolveClaudeExecutable', () => {
	it('resolves the trimmed first line of stdout on a successful lookup', async () => {
		execFile.mockImplementation((_command, _args, callback) => {
			callback(null, '/usr/local/bin/claude\n')
		})
		const { resolveClaudeExecutable } =
			await import('./resolve-claude-executable')

		await expect(resolveClaudeExecutable()).resolves.toBe(
			'/usr/local/bin/claude'
		)
	})

	it('resolves undefined when the CLI is not found', async () => {
		execFile.mockImplementation((_command, _args, callback) => {
			callback(new Error('not found'), '')
		})
		const { resolveClaudeExecutable } =
			await import('./resolve-claude-executable')

		await expect(resolveClaudeExecutable()).resolves.toBeUndefined()
	})

	it('caches a successful lookup, never shelling out again', async () => {
		execFile.mockImplementation((_command, _args, callback) => {
			callback(null, '/usr/local/bin/claude\n')
		})
		const { resolveClaudeExecutable } =
			await import('./resolve-claude-executable')

		await resolveClaudeExecutable()
		await resolveClaudeExecutable()

		expect(execFile).toHaveBeenCalledTimes(1)
	})

	it('does not cache a failed lookup, so a later call retries', async () => {
		execFile.mockImplementation((_command, _args, callback) => {
			callback(new Error('not found'), '')
		})
		const { resolveClaudeExecutable } =
			await import('./resolve-claude-executable')

		await resolveClaudeExecutable()
		execFile.mockImplementation((_command, _args, callback) => {
			callback(null, '/usr/local/bin/claude\n')
		})
		const second = await resolveClaudeExecutable()

		expect(execFile).toHaveBeenCalledTimes(2)
		expect(second).toBe('/usr/local/bin/claude')
	})
})
