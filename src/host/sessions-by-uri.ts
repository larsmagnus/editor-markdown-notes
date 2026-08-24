/**
 * Groups values under a URI key, for a document that can be open in more
 * than one panel at once.
 */
export class SessionsByUri<T> {
	private readonly sessions = new Map<string, Set<T>>()

	public add(uri: string, session: T): void {
		let set = this.sessions.get(uri)
		if (!set) {
			set = new Set()
			this.sessions.set(uri, set)
		}
		set.add(session)
	}

	public remove(uri: string, session: T): void {
		const set = this.sessions.get(uri)
		set?.delete(session)
		if (set?.size === 0) this.sessions.delete(uri)
	}

	public get(uri: string): ReadonlySet<T> | undefined {
		return this.sessions.get(uri)
	}
}
