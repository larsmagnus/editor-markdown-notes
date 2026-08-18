/**
 * Whether the search-reveal instrumentation runs.
 *
 * Off unless `EMN_PROBE` is set, so a normal session pays nothing: no event
 * subscriptions, no reflection over API objects, no writes to the probe log.
 * The integration suites set it themselves, which is what keeps the probe
 * exercised rather than rotting.
 *
 * Read through a function rather than captured at import time, so a test can
 * set the variable after the module graph has loaded.
 */
export function isProbeEnabled(): boolean {
	return Boolean(process.env.EMN_PROBE)
}
