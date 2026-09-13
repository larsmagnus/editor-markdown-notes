'use strict'

/**
 * Loads a bundled chunk under `out/host/` (real ESM) via a genuine dynamic
 * `import()`, given its name without the `.mjs` extension.
 *
 * Hand-written, not `tsc`-compiled: `tsconfig.host.json`'s CommonJS module
 * target rewrites `await import()` into a `require()`-wrapped shim, which
 * cannot load an ES module. Written in plain JS instead so the dynamic import
 * reaches Node exactly as typed, working on any Node version rather than
 * depending on the newer synchronous `require(esm)` support. Shared by every
 * dependency that needs the same treatment - the Agent SDK, pdfjs-dist - so
 * adding another one is a bundle config and a call site, not a new loader.
 */
module.exports.loadEsmBundle = (name) => import(`./${name}.mjs`)
