import type { Editor } from '@tiptap/react'
import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'

import type { PlacedToken } from '@/editor/extensions/syntax-highlight/syntax-highlight-extension'
import { useDocumentRevision } from '@/hooks/use-document-revision'
import { useShikiTheme } from '@/hooks/use-shiki-theme'
import type { RelativeToken } from '@/lib/syntax-highlight-tokens'

/** The two custom properties `.ProseMirror pre` reads in `globals.css`. */
export type CodeBlockStyle = CSSProperties & {
	'--shiki-bg': string
	'--shiki-fg': string
}

/**
 * Tokenizes every fenced code block with Shiki, feeds the results into
 * `SyntaxHighlight`'s decoration plugin, and returns the theme's own editor
 * background and foreground for the caller to publish on the editor container.
 *
 * Mirrors `useTextTools`: React owns the pipeline, `editor.commands.
 * setSyntaxHighlightRanges` is the only thing the ProseMirror side sees. Runs
 * on the same debounced document revision retext uses - Shiki's JS-engine
 * tokenization of one block at a time is cheap enough that a separate,
 * faster-firing debounce would only add a second competing timer with no
 * visible benefit.
 *
 * The colors come back from here rather than from a hook of their own because
 * this is the one place that already has a loaded highlighter, and it only has
 * one once the document actually contains a code block. Shiki and the grammars
 * are reached through `await import()` for the same reason `renderMermaid` and
 * `analyze-client` are - a note without code blocks loads none of it.
 */
export function useSyntaxHighlight(editor: Editor | null) {
	const theme = useShikiTheme()
	const revision = useDocumentRevision(editor)
	const [codeBlockStyle, setCodeBlockStyle] = useState<CodeBlockStyle>()

	// Keyed by `themeId:language:text`, so a block whose content and theme
	// haven't changed skips re-tokenizing even when something elsewhere in the
	// doc triggered this pass. Stores positions relative to the block's own
	// text, not the document, so a cache hit is reusable at whatever position
	// the block has moved to since.
	const cacheRef = useRef(new Map<string, RelativeToken[]>())

	useEffect(() => {
		if (!editor) return

		let cancelled = false

		const run = async () => {
			const { collectCodeBlocks, placeTokens, tokenizeBlock } =
				await import('@/lib/syntax-highlight-tokens')
			if (cancelled) return

			// The positions below are absolute, and everything here is awaited - a
			// grammar chunk alone can be hundreds of kilobytes, which is long
			// enough to type through. Applying them to a document that has moved on
			// paints colors at the wrong offsets, so the dispatch is skipped
			// instead; the edit that moved it bumps `revision`, which queues
			// another pass.
			const doc = editor.state.doc
			const blocks = collectCodeBlocks(doc)

			if (blocks.length === 0) {
				cacheRef.current = new Map()
				if (!cancelled) editor.commands.setSyntaxHighlightRanges([])
				return
			}

			const { ensureTheme, getHighlighter, themeColors } =
				await import('@/lib/shiki-highlighter')
			if (cancelled) return

			const highlighter = await getHighlighter()
			if (cancelled) return

			const themeId = await ensureTheme(highlighter, theme)
			if (cancelled) return

			const { bg, fg } = themeColors(highlighter, themeId)
			setCodeBlockStyle({ '--shiki-bg': bg, '--shiki-fg': fg })

			const nextCache = new Map<string, RelativeToken[]>()
			const tokens: PlacedToken[] = []

			for (const block of blocks) {
				const cacheKey = `${themeId}:${block.language}:${block.text}`
				// Per block, not around the loop: a grammar that fails to fetch or
				// to tokenize must cost that one block its colors, not every other
				// block in the note.
				const relative =
					cacheRef.current.get(cacheKey) ??
					(await tokenizeBlock(highlighter, block, themeId).catch(
						(error: unknown) => {
							console.error(`Failed to highlight ${block.language}:`, error)
							return []
						}
					))
				if (cancelled) return

				nextCache.set(cacheKey, relative)
				tokens.push(...placeTokens(block, relative))
			}

			cacheRef.current = nextCache
			if (cancelled || editor.state.doc !== doc) return
			editor.commands.setSyntaxHighlightRanges(tokens)
		}

		run().catch((error: unknown) => {
			if (cancelled) return
			console.error('Syntax highlighting failed:', error)
		})

		return () => {
			cancelled = true
		}
	}, [editor, revision, theme])

	return codeBlockStyle
}
