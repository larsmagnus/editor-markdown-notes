import { createContext, useContext } from 'react'

import type { SourcePlacedIssue } from '#src/lib/text-tools/place-source-issues'

/** Whether raw mode is the one on screen, and its current placed issues - what
 *  `TextToolsIssueGroup` needs to know whether a click should select inside
 *  the raw textarea instead of the live editor, and where. */
export type RawTextToolsLocation = {
	active: boolean
	issues: SourcePlacedIssue[]
}

export const RawTextToolsContext = createContext<RawTextToolsLocation>({
	active: false,
	issues: [],
})

/** Reads whether raw mode is on screen and its current placed issues, set by
 *  `EditorBody`. */
export function useRawTextToolsLocation(): RawTextToolsLocation {
	return useContext(RawTextToolsContext)
}
