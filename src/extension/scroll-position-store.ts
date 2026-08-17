/**
 * Where each open note was last scrolled to, for the life of this extension
 * host.
 *
 * Deliberately in memory rather than in `globalState`: the webview is torn down
 * both when its tab closes and whenever VSCode backgrounds it, so an offset has
 * to outlive the panel - but an offset saved across a window reload would be
 * measured against a file that may since have been edited elsewhere, and
 * restoring to the wrong place is worse than opening at the top.
 */
export class ScrollPositionStore {
	private readonly positions = new Map<string, number>()

	/** `0` for a note not seen yet this session, which is the top. */
	public get(uri: string): number {
		return this.positions.get(uri) ?? 0
	}

	public set(uri: string, scrollTop: number) {
		this.positions.set(uri, Math.max(0, scrollTop))
	}
}
