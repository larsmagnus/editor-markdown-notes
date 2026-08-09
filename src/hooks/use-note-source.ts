import useContent from '@/hooks/use-content'
import { useHostDocument } from '@/hooks/use-host-document'
import { useSaveShortcut } from '@/hooks/use-save-shortcut'
import { useSettings } from '@/hooks/use-settings'

/**
 * The note on screen, from whichever side owns it.
 *
 * In VSCode that is the extension host; standalone it is one of the demo notes
 * in `public/`, which the file selector switches between. Both hooks run either
 * way — hooks cannot be called conditionally — but the demo fetches are skipped
 * inside VSCode.
 */
export function useNoteSource(defaultFileName: string) {
	const { isVSCodeContext } = useSettings()

	const host = useHostDocument()
	const demo = useContent({ defaultFileName, enabled: !isVSCodeContext })

	useSaveShortcut(isVSCodeContext)

	if (isVSCodeContext) {
		return {
			content: host.content,
			fileName: host.fileName,
			// VSCode switches files by opening another editor, not through the app.
			setFileName: () => {},
			files: [],
			saveContent: host.saveContent,
		}
	}

	return {
		content: demo.content,
		fileName: demo.fileName,
		setFileName: demo.setFileName,
		files: demo.files,
		// Standalone there is no host to post to; `useNoteSave` routes to the
		// `updateNotes` stub instead and never reaches this.
		saveContent: host.saveContent,
	}
}
