/** Enough parallel reads to keep the disk busy without exhausting file handles. */
const IO_BATCH_SIZE = 64

/** `Promise.all` over `items`, `IO_BATCH_SIZE` at a time. */
export async function inBatches<T, R>(
	items: T[],
	run: (item: T) => Promise<R>
): Promise<R[]> {
	const results: R[] = []

	for (let start = 0; start < items.length; start += IO_BATCH_SIZE) {
		const batch = items.slice(start, start + IO_BATCH_SIZE)
		results.push(...(await Promise.all(batch.map(run))))
	}

	return results
}
