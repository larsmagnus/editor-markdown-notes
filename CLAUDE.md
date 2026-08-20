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

Vitest runs `src/**/*.test.{ts,tsx}` except `src/test/**`, which `tsconfig.extension.json` compiles without a DOM lib — keep webview tests out of it. Those suites are `pnpm test:extension`, which boots a real VS Code and is the only way to check host behaviour.

jscpd v5 has no Node API (Rust rewrite) — shell out to the `cpd`/`jscpd` binary, don't `import` it.

Never replace `navigator` wholesale in a test that also mounts an editor: a stub built as `{ ...navigator, clipboard }` drops the prototype getters ProseMirror reads to detect the browser, and the editor then silently never mounts. Mock `src/lib/clipboard.ts` — the app's only route to the clipboard — or let `userEvent.setup()` install its own stub.

#### Complexity budget

`pnpm complexity` gates CI at an FTA score of 50 (`fta.json` holds the cap and exclusions). Aim for ≤45 on files you're already editing so the next unrelated change doesn't tip it over CI — a score near the cap alone isn't a reason to touch a file. When branching gets in the way of the budget, prefer a data-table/lookup (e.g. a `Record`) over a `switch`. Check with `npx fta src -c fta.json -s 1000 --format json` — a capped run stops at the first breach in walk order, not the worst one.

### VSCode Extension

#### Debugging a blank panel

Run "Editor Markdown Notes: Show logs" (Output → _Editor Markdown Notes_). The webview console is invisible to the host, so `src/extension/webview-document.ts` injects a bridge (`src/lib/webview-diagnostics.ts`) ahead of the app bundle that forwards uncaught errors, rejected promises, CSP violations, `console.error`/`warn`, and a "#root is still empty" watchdog into that channel. Nothing logged means the host never got that far — check the entry-chunk line at the top.

## Architecture

### Editor System (`src/editor/`)

- Styles are a data table, not a dispatch: `text-style-commands.ts`/`list-style-commands.ts` give each style its command, `isActive` name, and `editor.can()` check; `use-editor-styles.ts` reads all three. Replaced three hand-synced switch statements whose bugs — a query that applied the style, two styles falling off the end and reading as permanently disabled — can't happen in a table.
- A `tiptap-markdown` serializer only activates when a matching TipTap extension is registered, otherwise the schema silently drops the feature and auto-save writes the loss to disk. Registering the node is the whole fix. `markdown-round-trip.test.ts` documents exactly what survives a save — read it before changing the schema.
- Table cells hold inline content directly (not TipTap's default `block+`), so `extensions.ts` carries its own table serializer (`table/extension.ts`); `tiptap-markdown`'s reaches for a paragraph that no longer exists. Same reason pasted HTML goes through `table/flatten-pasted-cells.ts` first.
- `table/alignment.ts`, `table/slice.ts`, `table/commands.ts`, `table/cell-selection.ts`, and `table/caret.ts` each carry the one downstream consequence of that choice they exist to fix — read their doc comments before touching cell-selection or caret behavior.
- A table whose header row is not row 0 has no GFM syntax, so the serializer writes the whole table out as HTML and auto-save replaces the user's markdown with it. `prosemirror-tables` reaches that shape on its own — "add row above" from the header row builds the new row from plain cells — so `table/header.ts` restores the invariant in an `appendTransaction` rather than at any one call site. `table/shape.ts` decides what GFM can express; it is the thing that rejects the shape.
- Only `|` is escaped per-cell rather than globally (`markdown-escaping.ts` reads `inTable`), and cells serialize on `content.size`, not on their text — an image-only cell has no text and used to save as empty.
- The table handles measure cell rectangles rather than using floating-ui (`use-table-anchor.ts`), which is what makes them testable — happy-dom has no layout engine, and `editor.test.tsx` already has to stub `MenuBubble` for exactly that reason.
- `markdown-clipboard-extension.ts` is also the hook for every paste that carries no `text/html` at all — terminal output, a plain editor — so it reinterprets only text that `looks-like-block-markdown.ts` recognises as block structure. Inline syntax is the paste rules' business (`italic-extension.ts` and its like), not this one's.
- Mermaid is rendering-only: `codeBlock` keeps its name (so the fenced-block serializer stays attached) while swapping in the `code-block-view.tsx` node view. `render-mermaid.ts` is lazy-imported so a note without diagrams never loads it. The diagram is a `PanZoom` viewport, so a click on it starts a pan and cannot also open the source — `mermaid/toolbar.tsx` owns that, and is the only way in.
- `components/pan-zoom.tsx` wraps `react-zoom-pan-pinch` for any oversized media. Two of its props are load-bearing: `wheel.activationKeys` must be a predicate, since the library requires _every_ key in a plain list (`['Control', 'Meta']` would zoom only while both were held); and the size bounds go on `TransformComponent`'s own wrapper, which is both the clipping box and the rectangle pan bounds are measured against.
- Images resolve at render time only (`resolve-image-src.ts`); the saved `src` keeps the author's path. Needs `icon-editor-markdown-notes.png` duplicated between `public/` and the workspace root, since each is a different app's root. The image node also needs `atom: true` — without it, a click places a text cursor next to the image instead of a `NodeSelection`, so the bubble menu's image controls never see it as selected.
- The bubble menu reads `isActive('image')` through `useEditorState`, not directly off `editor` — `useEditor`'s `shouldRerenderOnTransaction` defaults off, so a direct read never updates after mount even though ProseMirror's own decorations still look right.
- `image/keyboard-nav.ts` focuses `view`, never the `<img>` itself — the bubble menu's `shouldShow` requires `activeElement === view.dom` exactly, and focusing a descendant fails that check silently. The selection ring is CSS on `.ProseMirror-selectednode` for the same reason, not `:focus-visible`.
- YAML frontmatter is stripped before `setContent` and re-attached on save (`frontmatter.ts`), since markdown-it has no concept of it and would parse `---` as an `<hr>`.
- Syntax highlighting is decorations over the real editable text, never a rendered overlay — code has to stay colored while it is typed into, which is what separates it from mermaid's swap. `shiki-language-map.ts` is a hand-written fence-tag → grammar table because Vite cannot split a templated `import()` and a fence tag is freeform text that must never reach an import specifier; an unmapped tag renders plain, never throws.
- `search-reveal/` matches by searching the rendered text — no source map exists. First match only: just `search.action.copyMatch` knows which was clicked, and it costs the clipboard.
- Mount-time decorations must map through transactions, not clear on `docChanged` — startup transactions wipe them. Run-once state belongs on the editor instance and in `panel-state.ts`: TipTap rebuilds the editor, a backgrounded tab rebuilds the webview from frozen HTML.
- Not supported: merged cells (fall back to raw HTML), footnotes, underline/highlight/sub/sup.

### Text tools (`src/lib/text-tools/`)

- React owns the pipeline; the `textTools` extension only draws decorations it's handed, because `useEditor` builds the editor once and a conditional extension list would tear it down on every toggle.
- The worker must be `?worker&inline` — a plain `new Worker(new URL(…))` resolves against the webview's CDN host, a different origin from the document, and workers must be same-origin. Inlining boots it from a same-origin blob URL instead (why CSP carries `worker-src blob:`), covered by `webview-startup.test.ts`.
- Retext imports are isolated to `run-pipeline.ts`/`word-issues.ts`/`readability-issues.ts`/`spelling-issues.ts`, the only things the worker pulls in (~45kB chunk). Nothing on the main thread may import them directly — go through `analyze-client.ts`'s `await import()`.
- Two readability passes, not one, because `unified` merges the options of a plugin used twice on one processor; the severity tiers sit six years apart since the seven algorithms only start separating at that gap.
- The `dictionary-*` packages hide their `.aff`/`.dic` behind a bare-string `exports`; `dictionaryAliases()` in `vite.config.ts` aliases them beside the resolved entry. The patterns must be regexes ending `(\?.*)?$` — the `?raw` query is part of the id, so an exact-string alias never matches and the build fails on the exports field instead.
- nspell needs those files as **strings**. `affix()` calls `doc.toString('utf8')`, which on the `Uint8Array` its own types promise returns `"104,101,…"` — no throw, just every word in the note misspelt.
- `retext-spell` builds nspell when it attaches, so `spelling-issues.ts` caches a processor per language and filters personal words afterwards instead of using its `ignore` option. That cache also makes its `max` suggestion budget last the worker's life rather than one run — left at the default of 30 the panel silently stops offering corrections a minute into typing, so it is set to infinity. Safe because suggestions are memoised per word; the cost that remains is gibberish, which `suggest()` searches ~200ms for against ~15ms for a plausible misspelling.
- `document-text.ts` has a second implementation in `src/mcp/`, sharing only `prose-policy.ts` — `prose-parity.test.ts` fails if the two walks diverge.
- Adding a rule touches four places past the id in `src/shared/messages.ts` — `RULES`, `RULE_PLUGINS`, `RULE_SOURCES`, and a test — all keyed by `TextToolRuleId` so a miss fails to compile, except `RULE_SOURCES` (reversed at runtime), where a miss silently reports nothing.

### MCP server (`src/mcp/`)

`src/mcp/README.md` carries the why. The build is the only trap not in it: its own process, so unlike `agent-sdk-bundle.ts` it needs **no** `.cjs` loader shim — that shim exists because the CommonJS host has to reach an ES module, while this is a fresh `node` VSCode starts. Excluded from `tsconfig.extension.json` and bundled with `--alias:@=./src`, so it uses `@/` imports like the webview rather than the host's relative ones.

### Content Management

- `src/hooks/use-content.ts` - Fetches the standalone web app's demo notes from `public/`. They sit there so their images are reachable by URL; `import.meta.glob` cannot see into `public/`, hence the hardcoded file list
- `src/lib/update-notes.ts` - The standalone save path, and a stub: edits in the web build are logged, not persisted

### UI Components (`src/components/`)

- `content.tsx` - Layout: renders the toolbar and `note-body.tsx`, which picks the raw markdown textarea or the TipTap editor. `src/hooks/use-note-source.ts` picks the content source (VSCode vs. local). Its one `overflow-auto` div is the app's scroll container, where `use-scroll-position.ts` reopens each note where it was left — which is why nothing in the editor may autofocus, TipTap scrolling its caret into view over that
- `raw-markdown-editor.tsx` - The raw view, which saves the file **verbatim, frontmatter included**, because it shows the whole file. `use-note-save.ts` is the debounce and Cmd/Ctrl+S path both it and the TipTap editor share; the frontmatter split is the TipTap side's business and has already happened by the time text reaches that hook
- `app-error-boundary.tsx` - Every failable seam wraps in this. Boundaries must report explicitly (`report-error.ts` → `console.error` → the log bridge) — the startup watchdog only fires while `#root` is empty, and a rendered fallback fills it. The mermaid boundary sits in `src/editor/code-block-view.tsx`, not around the editor, because TipTap mounts each node view as its own React root
- `toolbar.tsx` - The `ToggleGroup` rebuilds every key from the selected array, so both directions are derived from the one table in `view-toggle-options.ts` - a toggle listed in only one of them used to be silently reset the next time any other was used
- `settings-provider.tsx` - Single source of truth for `viewOptions` (user toggles) and `settings` (VSCode config). In VSCode it seeds from `window.initialConfig`, posts `setViewOptions` to the host, and re-renders on `config` broadcasts; standalone it falls back to `localStorage`. `isVSCodeContext` is the app's only answer to that question and must derive synchronously from `window.vscode` — deriving it in an effect reports `false` on first render, long enough to send a save down the wrong path.
- `theme-provider.tsx` & `theme-toggle.tsx` - The theme lives in `viewOptions`, so it persists alongside the other toggles

**One exported component per file.** `react/only-export-components` is enabled (off for `src/components/ui/**`), so contexts and hooks live in `src/hooks/` (`use-settings.ts`, `use-theme.ts`) and the matching `*-provider.tsx` files export only the provider component.

### Extension Settings

Contributed under `editorMarkdownNotes` in `package.json` (`contributes.configuration`, also what surfaces the cog → Settings entry). View options persist in `context.globalState` under `editorMarkdownNotes.viewOptions` and broadcast to every open panel, keeping tabs in sync. `toggleRaw`/`toggleFullWidth`/`toggleTextTools`/`selectTheme` drive the same state from the command palette, gated on `activeCustomEditorId`.

The Claude prompt templates (`claude-prompt.ts`) take `%@`, `%s` and `%c`, substituted in one pass so a path or excerpt containing a token is not substituted into twice. Everything reaching `%c` is flattened to one line and truncated: `terminal.sendText` types the command into a live shell, where a newline lands as Enter. The excerpt is a locator for Claude to find in a file it is separately told to read, never a faithful copy.

### Bundle chunks

**Three things keep the split bundle loadable in the webview; break one and the panel loads blank.** `base: './'`, because root-absolute chunk URLs point outside the extension under a `vscode-webview://` origin. `${webview.cspSource}` in `script-src`, because the entry script's nonce is not inherited by the modules it imports. And `build.manifest`, which `readEntryChunk` reads to find the hashed entry.

### Validation

`src/lib/schemas.ts` holds the zod schemas for everything the webview receives from outside itself (localStorage, host `config` messages). Every field uses `.catch()`, so parsing degrades to a default rather than throwing and blanking the editor.

**Keep zod out of the extension host.** The `.vsix` is packaged with `--no-dependencies`, so `node_modules` is not shipped and anything `src/extension.ts` requires at runtime must be dependency-free. The host merges over `DEFAULT_SETTINGS` / `DEFAULT_VIEW_OPTIONS` instead.

### File Organization

- `public/*.md` - Demo notes, one per image-resolution rule; kept out of the `.vsix` by `.vscodeignore`
- A feature cluster that outgrows flat `prefix-*` files gets its own subdirectory with the prefix dropped inside it — `src/editor/table/`, `src/lib/text-tools/`. Hooks stay in `src/hooks/` regardless of which feature they belong to, same as every other feature's hooks.

## Important Notes

- The editor auto-saves with 1000ms debounce using `useDebounceValue`
