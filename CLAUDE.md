# [CLAUDE.md](http://CLAUDE.md)

## Maintaining this file

Only add a line here if a future session couldn't cheaply rediscover it by reading the code, running `--help`, or checking `package.json` — a gotcha, a non-obvious constraint, or the reasoning behind a decision. A line that just restates a filename or a dependency list doesn't earn its place. Prefer deleting a stale line over leaving it.

## Project Overview

A VSCode extension for editing markdown in a live preview powered by a React web application.

- **VSCode Extension**: `src/extension.ts` only activates; everything else lives in `src/extension/` and compiles to `out/extension.js`, a name `package.json`'s `main` field requires — renaming to `src/extension/index.ts` would break activation. `tsconfig.extension.json` has no `paths` mapping, so a stray `@/` alias fails typecheck instead of MODULE_NOT_FOUND at activation. The root package is ESM for Vite, but the extension host needs CommonJS: `vscode:compile` writes `out/package.json` as `{"type":"commonjs"}`, making everything under `out/` CJS.
- **Shared contract**: `src/shared/messages.ts` holds host ↔ webview message types and defaults, included in both tsconfig projects; the CJS sentinel above is what makes value imports safe from the extension host.

## Development Commands

### Quality & Testing

`knip.jsonc` must include `.css` in `project`, or Tailwind v4's `@plugin` directives in `src/globals.css` don't count as usage and those plugins read as unused deps. `src/components/ui/**` exports are exempt, keeping vendored shadcn files a clean overwrite.

Vitest runs `src/**/*.test.{ts,tsx}` except `src/test/**`, which `tsconfig.extension.json` compiles without a DOM lib — keep webview tests out of it.

#### Complexity budget

`pnpm complexity` gates CI at an FTA score of 50 (`fta.json` holds the cap and exclusions). Aim for ≤45 on files you're already editing so the next unrelated change doesn't tip it over CI — a score near the cap alone isn't a reason to touch a file. When branching gets in the way of the budget, prefer a data-table/lookup (e.g. a `Record`) over a `switch`. Check with `npx fta src -c fta.json -s 1000 --format json` — a capped run stops at the first breach in walk order, not the worst one.

### VSCode Extension

#### Debugging a blank panel

Run "Editor Markdown Notes: Show logs" (Output → _Editor Markdown Notes_). The webview console is invisible to the host, so `src/extension/webview-document.ts` injects a bridge (`src/lib/webview-diagnostics.ts`) ahead of the app bundle that forwards uncaught errors, rejected promises, CSP violations, `console.error`/`warn`, and a "#root is still empty" watchdog into that channel. Nothing logged means the host never got that far — check the entry-chunk line at the top.

## Architecture

### Editor System (`src/editor/`)

- Styles are a data table, not a dispatch: `text-style-commands.ts`/`list-style-commands.ts` give each style its command, `isActive` name, and `editor.can()` check; `use-editor-styles.ts` reads all three. Replaced three hand-synced switch statements whose bugs — a query that applied the style, two styles falling off the end and reading as permanently disabled — can't happen in a table.
- A `tiptap-markdown` serializer only activates when a matching TipTap extension is registered, otherwise the schema silently drops the feature and auto-save writes the loss to disk. Registering the node is the whole fix. `markdown-round-trip.test.ts` documents exactly what survives a save — read it before changing the schema.
- Table cells hold inline content directly (not TipTap's default `block+`), so `extensions.ts` carries its own table serializer; `tiptap-markdown`'s reaches for a paragraph that no longer exists.
- Mermaid is rendering-only: `codeBlock` keeps its name (so the fenced-block serializer stays attached) while swapping in the `code-block-view.tsx` node view. `render-mermaid.ts` is lazy-imported so a note without diagrams never loads it.
- Images resolve at render time only (`resolve-image-src.ts`); the saved `src` keeps the author's path. Needs `icon-editor-markdown-notes.png` duplicated between `public/` and the workspace root, since each is a different app's root.
- YAML frontmatter is stripped before `setContent` and re-attached on save (`frontmatter.ts`), since markdown-it has no concept of it and would parse `---` as an `<hr>`.
- Not supported: table column alignment, merged cells (fall back to raw HTML), syntax highlighting, footnotes, underline/highlight/sub/sup.

### Text tools (`src/lib/text-tools/`)

- React owns the pipeline; the `textTools` extension only draws decorations it's handed, because `useEditor` builds the editor once and a conditional extension list would tear it down on every toggle.
- The worker must be `?worker&inline` — a plain `new Worker(new URL(…))` resolves against the webview's CDN host, a different origin from the document, and workers must be same-origin. Inlining boots it from a same-origin blob URL instead (why CSP carries `worker-src blob:`), covered by `webview-startup.test.ts`.
- Retext imports are isolated to `run-pipeline.ts`/`word-issues.ts`/`readability-issues.ts`, the only things the worker pulls in (~45kB chunk). Nothing on the main thread may import them directly — go through `analyze-client.ts`'s `await import()`.
- Two readability passes, not one, because `unified` merges the options of a plugin used twice on one processor; the severity tiers sit six years apart since the seven algorithms only start separating at that gap.
- Adding a rule touches four places past the id in `src/shared/messages.ts` — `RULES`, `RULE_PLUGINS`, `RULE_SOURCES`, and a test — all keyed by `TextToolRuleId` so a miss fails to compile, except `RULE_SOURCES` (reversed at runtime), where a miss silently reports nothing.

### Content Management

- `src/hooks/use-content.ts` - Fetches the standalone web app's demo notes from `public/`. They sit there so their images are reachable by URL; `import.meta.glob` cannot see into `public/`, hence the hardcoded file list
- `src/lib/update-notes.ts` - The standalone save path, and a stub: edits in the web build are logged, not persisted

### UI Components (`src/components/`)

- `content.tsx` - Layout: renders the toolbar and `note-body.tsx`, which picks the raw markdown textarea or the TipTap editor. `src/hooks/use-note-source.ts` picks the content source (VSCode vs. local)
- `raw-markdown-editor.tsx` - The raw view, which saves the file **verbatim, frontmatter included**, because it shows the whole file. `use-note-save.ts` is the debounce and Cmd/Ctrl+S path both it and the TipTap editor share; the frontmatter split is the TipTap side's business and has already happened by the time text reaches that hook
- `app-error-boundary.tsx` - Every failable seam wraps in this. Boundaries must report explicitly (`report-error.ts` → `console.error` → the log bridge) — the startup watchdog only fires while `#root` is empty, and a rendered fallback fills it. The mermaid boundary sits in `src/editor/code-block-view.tsx`, not around the editor, because TipTap mounts each node view as its own React root
- `toolbar.tsx` - The `ToggleGroup` rebuilds every key from the selected array, so both directions are derived from the one table in `view-toggle-options.ts` - a toggle listed in only one of them used to be silently reset the next time any other was used
- `settings-provider.tsx` - Single source of truth for `viewOptions` (user toggles) and `settings` (VSCode config). In VSCode it seeds from `window.initialConfig`, posts `setViewOptions` to the host, and re-renders on `config` broadcasts; standalone it falls back to `localStorage`. `isVSCodeContext` is the app's only answer to that question and must derive synchronously from `window.vscode` — deriving it in an effect reports `false` on first render, long enough to send a save down the wrong path.
- `theme-provider.tsx` & `theme-toggle.tsx` - The theme lives in `viewOptions`, so it persists alongside the other toggles

**One exported component per file.** `react/only-export-components` is enabled (off for `src/components/ui/**`), so contexts and hooks live in `src/hooks/` (`use-settings.ts`, `use-theme.ts`) and the matching `*-provider.tsx` files export only the provider component.

### Extension Settings

Contributed under `editorMarkdownNotes` in `package.json` (`contributes.configuration`, also what surfaces the cog → Settings entry). View options persist in `context.globalState` under `editorMarkdownNotes.viewOptions` and broadcast to every open panel, keeping tabs in sync. `toggleRaw`/`toggleFullWidth`/`toggleTextTools`/`selectTheme` drive the same state from the command palette, gated on `activeCustomEditorId`.

### Bundle chunks

**Three things keep the split bundle loadable in the webview; break one and the panel loads blank.** `base: './'`, because root-absolute chunk URLs point outside the extension under a `vscode-webview://` origin. `${webview.cspSource}` in `script-src`, because the entry script's nonce is not inherited by the modules it imports. And `build.manifest`, which `readEntryChunk` reads to find the hashed entry.

### Validation

`src/lib/schemas.ts` holds the zod schemas for everything the webview receives from outside itself (localStorage, host `config` messages). Every field uses `.catch()`, so parsing degrades to a default rather than throwing and blanking the editor.

**Keep zod out of the extension host.** The `.vsix` is packaged with `--no-dependencies`, so `node_modules` is not shipped and anything `src/extension.ts` requires at runtime must be dependency-free. The host merges over `DEFAULT_SETTINGS` / `DEFAULT_VIEW_OPTIONS` instead.

### File Organization

- `public/*.md` - Demo notes, one per image-resolution rule; kept out of the `.vsix` by `.vscodeignore`

## Important Notes

- The editor auto-saves with 1000ms debounce using `useDebounceValue`
