/**
 * esbuild's sole entry point for pdfjs-dist - never `tsc`'s (excluded in
 * `tsconfig.host.json`). Pointing esbuild at `pdf-text-extraction.ts` itself
 * would drag the rest of the `tsc`-compiled host graph through esbuild too;
 * a one-line re-export keeps the two build steps cleanly separated.
 *
 * Bundled to real ESM (`out/host/pdf-extractor-bundle.mjs`), not CJS, for the
 * same reason as `agent-sdk-bundle.ts`: `.mjs` forces Node to load it as a
 * real module despite `out/package.json`'s `"type": "commonjs"` sentinel.
 * `load-esm-bundle.cjs` is what loads it - `open-pdf-command.ts`'s own
 * `tsc`-compiled `import()` would otherwise be downleveled to a `require()`
 * that cannot read an ES module.
 */
export { extractPdfText } from '#src/host/pdf-text-extraction'
