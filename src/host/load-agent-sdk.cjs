'use strict'

/**
 * Loads the esbuild-bundled Agent SDK chunk (`agent-sdk-bundle.mjs`, real
 * ESM - `.mjs` so Node treats it as such despite `out/package.json`'s
 * `"type": "commonjs"` sentinel) via a genuine dynamic `import()`.
 *
 * Hand-written, not `tsc`-compiled: `tsconfig.host.json`'s CommonJS
 * module target rewrites `await import()` into a `require()`-wrapped shim,
 * which cannot load an ES module. Written in plain JS instead so the dynamic
 * import reaches Node exactly as typed, working on any Node version rather
 * than depending on the newer synchronous `require(esm)` support.
 */
module.exports.loadAgentSdk = () => import('./agent-sdk-bundle.mjs')
