import { useState } from 'react'

/**
 * Which top-level folders the index hides, leading what the host last
 * confirmed. Absent until the author changes it, so the first ask of each open
 * lets the host answer with what it stored for this workspace.
 */
export function useHiddenNoteDirectories(confirmed: string[] | undefined) {
	const [override, setOverride] = useState<string[]>()
	const hiddenDirectories = override ?? confirmed ?? []

	function toggleDirectoryHidden(directory: string) {
		setOverride(
			hiddenDirectories.includes(directory)
				? hiddenDirectories.filter((hidden) => hidden !== directory)
				: [...hiddenDirectories, directory]
		)
	}

	function resetHiddenOverride() {
		setOverride(undefined)
	}

	return {
		hiddenDirectories,
		hiddenOverride: override,
		toggleDirectoryHidden,
		resetHiddenOverride,
	}
}
