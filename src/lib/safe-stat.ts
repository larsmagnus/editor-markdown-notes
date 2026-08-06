import type { Stats } from 'fs'
import fs from 'fs/promises'

export async function safeStat(
	path: string,
	callback: (stats: Stats) => boolean
) {
	try {
		const status = await fs.stat(path)
		return callback(status)
	} catch {
		return false
	}
}
