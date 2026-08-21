/**
 * esbuild's sole entry point for the Agent SDK - never `tsc`'s (excluded in
 * `tsconfig.host.json`). Pointing esbuild at `claude-agent.ts` itself
 * would drag the rest of the `tsc`-compiled host graph through esbuild too;
 * a one-line re-export keeps the two build steps cleanly separated.
 *
 * Bundled to real ESM (`out/extension/agent-sdk-bundle.mjs`), not CJS: the
 * SDK itself calls `createRequire(import.meta.url)`, and esbuild's CJS output
 * shims `import.meta.url` to an empty object, breaking that call. `.mjs` (not
 * `.js`) forces Node to load it as a real module despite `out/package.json`'s
 * `"type": "commonjs"` sentinel. `load-agent-sdk.cjs` is what loads it -
 * `claude-agent.ts`'s own `tsc`-compiled `import()` would otherwise be
 * downleveled to a `require()` that cannot read an ES module.
 */
export { query } from '@anthropic-ai/claude-agent-sdk'
