import type { EditorState } from '@tiptap/pm/state'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { Extension } from '@tiptap/react'

import { issueClassName } from '@/lib/text-tools/issue-class-name'
import type { TextIssue } from '@/lib/text-tools/types'

/**
 * Draws the writing-tool findings onto the document.
 *
 * Deliberately dumb: React owns the pipeline and hands finished, already
 * positioned issues down through `setTextToolIssues`. The extension is
 * registered unconditionally - `useEditor` builds the editor once with no
 * dependency array, so a conditional extension list would mean tearing the
 * editor down every time the panel is toggled - and stays inert until issues
 * arrive.
 *
 * The name matches no `tiptap-markdown` serializer, so nothing here can reach
 * what gets written back to disk.
 */

/** An issue with its offsets already resolved to document positions. */
export type PlacedIssue = TextIssue & { from: number; to: number }

const textToolsPluginKey = new PluginKey<DecorationSet>('textTools')

function toDecorations(
	doc: Parameters<typeof DecorationSet.create>[0],
	issues: PlacedIssue[]
): DecorationSet {
	const decorations = issues.flatMap((issue) => {
		// A stale range would throw inside `Decoration.inline`.
		if (issue.from >= issue.to || issue.to > doc.content.size) return []

		return Decoration.inline(
			issue.from,
			issue.to,
			{
				class: issueClassName(issue.severity),
				title: issue.expected.length
					? `${issue.message} (try: ${issue.expected.join(', ')})`
					: issue.message,
			},
			// Identifies the decoration so the panel can jump to wherever this
			// issue has since been mapped to.
			{ issueStart: issue.start }
		)
	})

	return DecorationSet.create(doc, decorations)
}

/**
 * Where an issue currently sits, as opposed to where it sat when it was found.
 *
 * The panel's copy of an issue carries offsets into the text snapshot that was
 * analysed; typing since then has moved the document out from under them. The
 * decorations have been mapped through every transaction in the meantime, so
 * asking them is what keeps a click landing on the highlight it came from.
 */
export function findIssueRange(
	state: EditorState,
	issueStart: number
): { from: number; to: number } | null {
	const decorations = textToolsPluginKey.getState(state)
	if (!decorations) return null

	const [found] = decorations
		.find()
		.filter((decoration) => decoration.spec.issueStart === issueStart)

	return found ? { from: found.from, to: found.to } : null
}

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		textTools: {
			setTextToolIssues: (issues: PlacedIssue[]) => ReturnType
		}
	}
}

export const TextTools = Extension.create({
	name: 'textTools',

	addCommands() {
		return {
			setTextToolIssues:
				(issues: PlacedIssue[]) =>
				({ tr, dispatch }) => {
					// The transaction changes no content, so it must not reach the
					// markdown serializer or auto-save fires on every analysis.
					if (dispatch) dispatch(tr.setMeta(textToolsPluginKey, issues))
					return true
				},
		}
	},

	addProseMirrorPlugins() {
		return [
			new Plugin<DecorationSet>({
				key: textToolsPluginKey,
				state: {
					init: () => DecorationSet.empty,
					apply(tr, current) {
						const issues = tr.getMeta(textToolsPluginKey) as
							| PlacedIssue[]
							| undefined

						if (issues) return toDecorations(tr.doc, issues)

						// Mapping keeps the existing highlights roughly in place while
						// the next analysis is still debounced, instead of flickering
						// off on every keystroke.
						return tr.docChanged ? current.map(tr.mapping, tr.doc) : current
					},
				},
				props: {
					decorations(state) {
						return textToolsPluginKey.getState(state)
					},
				},
			}),
		]
	},
})
