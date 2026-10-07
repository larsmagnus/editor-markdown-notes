/**
 * How many cases a property test runs: `fallback` by default, so the unit
 * suite stays fast and deterministic, or `FUZZ_RUNS` for a deep run
 * (`pnpm test:fuzz`).
 */
export function fuzzRuns(fallback: number): number {
	const runs = Number(import.meta.env.FUZZ_RUNS)
	return Number.isInteger(runs) && runs > 0 ? runs : fallback
}
