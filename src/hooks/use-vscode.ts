import { useCallback, useEffect, useState } from 'react'

declare global {
	interface Window {
		vscode?: {
			postMessage: (message: any) => void
			getState: () => any
			setState: (state: any) => void
		}
		initialContent?: string
		fileName?: string
	}
}

interface VSCodeAPI {
	postMessage: (message: any) => void
	getState: () => any
	setState: (state: any) => void
}

export function useVSCode() {
	const [vscode, setVscode] = useState<VSCodeAPI | null>(null)
	const [content, setContent] = useState<string>('')
	const [fileName, setFileName] = useState<string>('')
	const [isVSCodeContext, setIsVSCodeContext] = useState(false)

	useEffect(() => {
		// Check if we're running in VSCode webview context
		if (typeof window !== 'undefined' && window.vscode) {
			setVscode(window.vscode)
			setIsVSCodeContext(true)

			// Get initial content from VSCode
			if (window.initialContent) {
				setContent(window.initialContent)
			}

			if (window.fileName) {
				setFileName(window.fileName)
			}

			// Listen for messages from VSCode
			const messageHandler = (event: MessageEvent) => {
				const message = event.data
				switch (message.type) {
					case 'update':
						setContent(message.content)
						setFileName(message.fileName)
						break
				}
			}

			// Listen for keyboard shortcuts
			const keyboardHandler = (event: KeyboardEvent) => {
				// Handle Cmd+S / Ctrl+S
				if ((event.metaKey || event.ctrlKey) && event.key === 's') {
					event.preventDefault()
					// Trigger a manual save by getting current content from the editor
					const saveEvent = new CustomEvent('vscode-save-request')
					window.dispatchEvent(saveEvent)
				}
			}

			window.addEventListener('message', messageHandler)
			window.addEventListener('keydown', keyboardHandler)

			// Request initial content
			window.vscode.postMessage({ type: 'getContent' })

			return () => {
				window.removeEventListener('message', messageHandler)
				window.removeEventListener('keydown', keyboardHandler)
			}
		}
	}, [])

	const saveContent = useCallback(
		(newContent: string) => {
			if (vscode && isVSCodeContext) {
				vscode.postMessage({
					type: 'save',
					content: newContent,
				})
			}
		},
		[vscode, isVSCodeContext]
	)

	return {
		content,
		fileName,
		isVSCodeContext,
		saveContent,
		setContent: (newContent: string) => {
			setContent(newContent)
			saveContent(newContent)
		},
	}
}
