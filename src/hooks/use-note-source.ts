import useContent from '#src/hooks/use-content'
import { useHostDocument } from '#src/hooks/use-host-document'
import { useSettings } from '#src/hooks/use-settings'

/**
 * The note on screen, from whichever side owns it.
 *
 * In VSCode that is the extension host; standalone it is one of the demo notes
 * in `public/`, which the file selector switches between. Both hooks run either
 * way — hooks cannot be called conditionally — but the demo fetches are skipped
 * inside VSCode.
 *
 * The save keystroke is not handled here, or anywhere in the webview any
 * more - `workbench.action.files.save` reaches the document directly, and
 * `onWillSaveTextDocument` (`save-participant.ts`) is what makes that save
 * exact rather than up to a debounce stale.
 */
export function useNoteSource(defaultFileName: string) {
	const { isVSCodeContext } = useSettings()

	const host = useHostDocument()
	const demo = useContent({ defaultFileName, enabled: !isVSCodeContext })

	if (isVSCodeContext) {
		return {
			content: host.content,
			fileName: host.fileName,
			// VSCode switches files by opening another editor, not through the app.
			setFileName: () => {},
			files: [],
			syncContent: host.syncContent,
		}
	}

	return {
		content: demo.content,
		fileName: demo.fileName,
		setFileName: demo.setFileName,
		files: demo.files,
		// Standalone there is no host to post to; `useNoteSync` routes to the
		// `updateNotes` stub instead and never reaches this.
		syncContent: host.syncContent,
	}
}
