import * as nodePath from 'path'

/** Whether `filePath` is `folderPath` itself, or somewhere inside it. */
export function isInsideFolder(filePath: string, folderPath: string): boolean {
	const relative = nodePath.relative(folderPath, filePath)

	return (
		relative === '' ||
		(!relative.startsWith(`..${nodePath.sep}`) &&
			relative !== '..' &&
			!nodePath.isAbsolute(relative))
	)
}

/**
 * The filename to copy to, dodging a collision with `exists` by adding a
 * numeric suffix - `diagram.png`, `diagram-1.png`, `diagram-2.png` - rather
 * than overwriting or prompting.
 */
export async function resolveCopyFilename(
	fileName: string,
	exists: (candidate: string) => Promise<boolean>
): Promise<string> {
	if (!(await exists(fileName))) return fileName

	const ext = nodePath.extname(fileName)
	const base = fileName.slice(0, fileName.length - ext.length)

	let suffix = 1
	while (await exists(`${base}-${suffix}${ext}`)) {
		suffix += 1
	}

	return `${base}-${suffix}${ext}`
}
