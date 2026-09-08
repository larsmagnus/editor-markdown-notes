import type { Plugin } from 'vite'

/** The half of pluralize's UMD guard that Rolldown cannot satisfy. */
const PLURALIZE_NODE_GUARD = "typeof require === 'function' && "

/**
 * Restores `pluralize`'s CommonJS export under Rolldown.
 *
 * The package is a UMD bundle that only assigns `module.exports` when
 * `typeof require === 'function'`. Rolldown defines a `require` stub when it
 * pre-bundles for dev but not in a production build, so there the factory falls
 * through to its browser-global branch and the module resolves to
 * `{ pluralize }` rather than the function itself - `syllable` then throws
 * inside the text tools worker, taking every readability check with it. What is
 * left of the guard holds under both the dev prebundle and the built CJS
 * wrapper.
 */
export function fixPluralizeUmd(): Plugin {
	return {
		name: 'fix-pluralize-umd',
		transform(code, id) {
			if (!id.endsWith('/pluralize/pluralize.js')) return null
			if (!code.includes(PLURALIZE_NODE_GUARD)) {
				throw new Error(
					'pluralize no longer guards its CommonJS export on `typeof require` - drop fixPluralizeUmd from vite.config.ts.'
				)
			}

			return code.replace(PLURALIZE_NODE_GUARD, '')
		},
	}
}
