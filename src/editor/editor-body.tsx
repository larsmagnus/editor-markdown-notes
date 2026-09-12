import type { Editor } from '@tiptap/react'
import { EditorContext } from '@tiptap/react'
import { cn } from 'cn'
import type { ReactNode } from 'react'
import { useState } from 'react'

import { AppErrorBoundary } from '#src/components/app-error-boundary'
import EditorModeLive from '#src/editor/editor-mode-live'
import { EditorModeRaw } from '#src/editor/editor-mode-raw'
import { EMPTY_TEXT_TOOLS_STATE } from '#src/hooks/use-report-live-editor'
import { TextToolsAside } from '#src/text-tools/text-tools-aside'

interface EditorBodyProps {
	content: string
	syncContent: (content: string) => void
	/** Show the markdown source rather than the rendered document. */
	raw: boolean
	className?: string
}

interface EditorModeSlotProps {
	active: boolean
	children: ReactNode
}

/**
 * A wrapper that either behaves as if it were not there, or hides its
 * subtree entirely.
 *
 * `display: contents` removes the wrapper from the box tree while active, so
 * the layout is exactly what it would be without this component - both slots
 * sit inside the same shared content column below, so neither mode's own
 * root needs to be a flex item itself. `hidden` removes the inactive one
 * from layout, the tab order and the accessibility tree instead.
 */
function EditorModeSlot({ active, children }: EditorModeSlotProps) {
	return <div className={cn(active ? 'contents' : 'hidden')}>{children}</div>
}

/**
 * The editor body itself: both the rendered document and the markdown source,
 * kept mounted side by side so switching between them does not cost either
 * its undo history.
 *
 * A view kept in raw mode's shadow, or vice versa, still has to absorb
 * incoming content while hidden - closing the gap is what lets the visible
 * view stay current the moment it is revealed - so only `raw` decides which
 * one is on screen, not which one is mounted.
 */
export function EditorBody({
	content,
	syncContent,
	raw,
	className,
}: EditorBodyProps) {
	const [textTools, setTextTools] = useState(EMPTY_TEXT_TOOLS_STATE)
	// Rendered as `EditorModeLive`'s sibling below, outside its own
	// `EditorContext.Provider` - the sidebar's issue entries call
	// `useCurrentEditor()` to select flagged text, so they need a provider of
	// their own reaching this far. `useReportLiveEditor` reports `null` back
	// before the editor mounts and again should `EditorModeLive`'s boundary
	// catch a bad document, so this never outlives the editor it points to.
	const [liveEditor, setLiveEditor] = useState<Editor | null>(null)

	return (
		<EditorContext.Provider value={{ editor: liveEditor }}>
			<div className="flex flex-1 items-start gap-4">
				{/* Shared by both modes so `MenuBar`/`ButtonAdd`/`MenuBubble` (rendered
				    inside live mode) stack above the document as normal block-flow
				    children of this div, rather than becoming flex-row items beside
				    the text-tools aside if that row wrapped them directly. */}
				<div className="relative min-w-xs flex-1 self-stretch">
					{/* Contained rather than fatal, so the toolbar survives and raw mode
					    stays reachable as the escape hatch for a note that will not parse. */}
					<EditorModeSlot active={!raw}>
						<AppErrorBoundary
							title="The editor stopped working"
							resetKeys={[content]}
						>
							<EditorModeLive
								content={content}
								syncContent={syncContent}
								active={!raw}
								includeTypesetClassNames
								className={className}
								onAnalysisChange={setTextTools}
								onEditorChange={setLiveEditor}
							/>
						</AppErrorBoundary>
					</EditorModeSlot>
					<EditorModeSlot active={raw}>
						<EditorModeRaw
							content={content}
							syncContent={syncContent}
							active={raw}
							className={className}
						/>
					</EditorModeSlot>
				</div>
				<TextToolsAside
					analysis={textTools.analysis}
					isAnalyzing={textTools.isAnalyzing}
					hasSpellingFailed={textTools.hasSpellingFailed}
				/>
			</div>
		</EditorContext.Provider>
	)
}
