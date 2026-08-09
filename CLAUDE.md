# [CLAUDE.md](http://CLAUDE.md)

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository

## Maintaining this file

Only add a line here if a future session couldn't cheaply rediscover it by reading the code, running `--help`, or checking `package.json` — a gotcha, a non-obvious constraint, or the reasoning behind a decision. A line that just restates a filename or a dependency list doesn't earn its place. Prefer deleting a stale line over leaving it.

## Project Overview

This is a VSCode extension for editing markdown in an live preview powered by a React web application. Main project components include:

- **VSCode Extension**: Entry point at `src/extension.ts`, which only activates; everything it wires up lives in `src/extension/`. Compiles to `out/extension.js`. That entry file has to keep its name — `package.json` points `main` at `./out/extension.js`, so turning it into `src/extension/index.ts` would break activation. Host code uses relative imports and `tsconfig.extension.json` deliberately has no `paths` mapping, so an `@/` alias fails typecheck instead of dying with MODULE_NOT_FOUND on activation. The root package is `type: "module"` for Vite, but the extension host needs CommonJS, so `vscode:compile` writes an `out/package.json` containing `{"type":"commonjs"}` — everything under `out/` is CJS because of that sentinel.
- **React Web App**: Entry point at `src/main.tsx`, bundled to `dist/` by Vite
- **Shared contract**: `src/shared/messages.ts` — host ↔ webview message types and defaults, included in both tsconfig projects. Value imports are safe from the extension host because the `out/package.json` sentinel makes `out/shared/messages.js` load as CommonJS.

## Development Commands

### Core Development

- `pnpm dev` - Start Vite development server for React app
- `pnpm build` - Build the React app and compile the extension (`tsc -b && vite build && pnpm vscode:compile`)
- `pnpm preview` - Preview built React app

### Versioning

`pnpm version minor` after a `feat` commit, `pnpm version patch` after `fix`/`perf`, `major` bumped manually for breaking changes only. Nothing for `chore`/`build`/`docs`/`test`/`refactor`. Log each bump in `CHANGELOG.md` under a matching `## [x.y.z]` heading.

### Quality & Testing

- `pnpm lint` - Run full linting pipeline: `pnpm typecheck && oxlint --fix && oxfmt`
- `pnpm typecheck` - TypeScript type checking without emitting files
- `pnpm test` - Run every suite (`test:unit` then `test:extension`)
- `pnpm test:unit` - Run the Vitest webview tests (happy-dom + Testing Library)
- `pnpm test:watch` - Vitest in watch mode
- `pnpm test:extension` - Run the VSCode extension tests via `@vscode/test-electron`
- `pnpm pretest` - Prepare for testing (compile + lint)
- `pnpm knip` - Find unused files, exports and dependencies. Deliberately out of `pnpm lint`

`knip.jsonc` has to include `.css` in `project`, or the Tailwind v4 `@plugin` directives in `src/globals.css` don't count as usage and the plugins read as unused dependencies. Exports in `src/components/ui/**` are exempt so vendored shadcn files stay a clean overwrite.

Vitest takes `src/**/*.test.{ts,tsx}` except `src/test/**`. Keep webview tests out of `src/test/` - it's compiled by `tsconfig.extension.json`, which has no DOM lib.

#### Complexity budget

`pnpm complexity` gates CI at an FTA score of 50. `fta.json` is the source of truth for the cap and the exclusions; `scripts/check-complexity.ts` (the PostToolUse hook) reads the same file, and both pass `--score-cap` on the command line as well, because fta parses its config with `unwrap_or_default()` - a typo'd key silently reverts the cap to 1000 and CI goes green enforcing nothing. The hook parses `fta.json` with a `z.strictObject` so that mistake surfaces somewhere.

Three things about the config that are easy to get wrong: fta looks for `<project>/fta.json`, and the script analyses `src`, so the root file only applies because of `--config-path`. Exclusion paths are relative to that analysed root, hence `/components/ui` rather than `src/components/ui`. And config values are appended to fta's defaults, never replace them. `fta.json` must be plain JSON - serde rejects comments.

Only `src/components/ui/**` is excluded, matching the exemption `knip.jsonc` already grants vendored shadcn files. Tests and stories stay in scope on purpose: the metric then enforces the WET testing rule for free, since an extracted test helper costs more than the duplication it removes.

The score is `(100/171) · [5.2·ln(U) + 0.23·C + 16.2·ln(L / ln C)]`, where `L` is lines excluding blanks and comments, `U` is unique operators plus operands, and `C` is cyclomatic complexity. Three consequences worth knowing before "simplifying" anything:

- **Comments and blank lines are free.** This repo's comment density costs nothing.
- **`C ≤ 2` zeroes the length term entirely**, because `ln(2) < 1` clamps the ratio to 1. A data table or a branch-free component is unbounded in length; `markdown-round-trip.test.ts` scores 16 at 369 lines. This is why a `Record` lookup beats parallel `switch` statements here twice over.
- **`C = 3` is the worst possible value** - a ~38-point cliff up from `C = 2`, after which _more_ branching lowers the score until `C ≈ 24`. A 40-line module with one `if` guard can score worse than the file it was extracted from. Keep imperative modules under ~60 counted lines, and don't add redundant guards to extracted children.

While refactoring use `npx fta src -c fta.json -s 1000 --format json` - a capped run exits on the first breach in walk order, not the worst one.

Aim to land a file you are already editing at 45 or below, so the next unrelated change to it does not break CI. Roughly a dozen sit in the 45-50 band and are fine where they are; a score just under the cap is not on its own a reason to touch a file. Splitting has a real cost - `dev-file-selector.tsx` sits at 48 because pulling its trigger out into a component would have meant re-implementing Radix's `asChild` prop forwarding, which is a worse trade than three points.

### VSCode Extension

- `pnpm vscode:compile` - Compile TypeScript extension (`tsc -p ./tsconfig.extension.json`, then write the `out/package.json` CommonJS sentinel)
- `pnpm vscode:watch` - Watch mode compilation for extension
- `pnpm vscode:prepublish` - Prepare extension for publishing

#### Testing the Extension

1. Press F5 in VSCode to launch the Extension Development Host
2. In the new window, open a `.md` file
3. Right-click the file and select "Open with Editor Markdown Notes", or run "Editor Markdown Notes: Open file" from the command palette
4. The custom React-based markdown editor should now load without errors

#### Debugging a blank panel

Run "Editor Markdown Notes: Show logs" (Output → _Editor Markdown Notes_). The webview's own console is invisible to the extension host, so `src/lib/webview-diagnostics.ts` provides a bridge that `src/extension/webview-document.ts` injects ahead of the app bundle that forwards uncaught errors, rejected promises, CSP violations, `console.error`/`console.warn` and a "#root is still empty" watchdog into that channel. A blank panel with nothing logged means the host never got that far - check the entry-chunk line at the top of the channel.

## Architecture

### Key Components

#### Editor System (`src/editor/`)

- `editor.tsx` - Layout only; `src/hooks/use-markdown-editor.ts` composes the editor, its frontmatter, autosaving and the writing checks
- `extensions.ts` - The TipTap schema (single source of truth, shared with the tests)
- `menu-bar.tsx` & `menu-bubble.tsx` - Editor toolbars and formatting controls
- `button-*.tsx` - Specialized formatting buttons (color, heading, style)

Styles are a data table, not a dispatch. `text-style-commands.ts` and `list-style-commands.ts` give each style its command, its `isActive` name and whether `editor.can()` can answer for it; `use-editor-styles.ts` reads all three from there. Three parallel switch statements used to have to be kept in step by hand, and both of the bugs that produced — a query that applied the style, and two styles that fell off the end and read as permanently disabled — are unrepresentable in the table.

**A `tiptap-markdown` serializer only activates when a TipTap extension of the matching name is registered.** Otherwise markdown-it parses the feature into HTML, the schema drops it, and auto-save writes the loss to disk. Registering the node is the whole fix - the serializers already ship with `tiptap-markdown`. Individual workarounds (tight task lists, inline images, strict linkify) are commented where they're configured.

`src/editor/markdown-round-trip.test.ts` builds a headless editor from the same exported `extensions`, so it documents exactly what survives a save. Read it before changing the schema.

Table cells hold inline content directly rather than TipTap's default `block+`, so nothing is wrapped in a paragraph. That means `extensions.ts` also carries its own table serializer - the one in `tiptap-markdown` reaches for the paragraph that no longer exists.

Mermaid diagrams are a rendering concern only. `codeBlock` is taken out of StarterKit so it can carry the `src/editor/code-block-view.tsx` node view, but the extension name stays `codeBlock` - which is what keeps the fenced-block serializer attached, so the source round-trips like any other fence. Mermaid itself is `import()`ed from `src/lib/render-mermaid.ts`, so a note without diagrams never loads it.

Images are rewritten at render only, by `src/lib/resolve-image-src.ts` - the node's `src` keeps the author's path, so saving never rewrites the file. The web app's root is `public/` and VSCode's is the workspace folder, so a root-absolute path needs an image at each; hence the duplicated `icon-editor-markdown-notes.png`.

Not supported: table column alignment, merged cells (they fall back to raw HTML), syntax highlighting, footnotes, underline/highlight/sub/sup.

YAML frontmatter never reaches the TipTap document - `tiptap-markdown`/markdown-it has no concept of it and would parse the `---` fence as an `<hr>`. `src/lib/frontmatter.ts` strips it from the markdown before `setContent` and re-attaches it before saving; `src/editor/frontmatter-panel.tsx` edits it as raw text above the document.

#### Text tools (`src/lib/text-tools/`)

The retext writing checks. React owns the pipeline and the `textTools` extension only draws decorations it is handed, because `useEditor` builds the editor once - a conditional extension list would tear it down on every toggle.

**The worker has to be `?worker&inline`.** A plain `new Worker(new URL(…))` gets a URL relative to the entry chunk, which under a webview resolves to the `vscode-cdn.net` resource host - a different origin from the `vscode-webview://` document, and a worker must be same-origin. Inlining boots it from a blob URL instead, which inherits the document's origin; that blob is why `buildContentSecurityPolicy` carries `worker-src blob:`. Dropping that directive fails only at runtime and only once the panel is opened, so `src/test/webview-startup.test.ts` opens a note with the tools on and asserts the log channel stays quiet.

`run-pipeline.ts`, `word-issues.ts` and `readability-issues.ts` hold every retext import between them and are the only things the worker pulls in, which is what keeps the ~45kB gzipped stack in its own chunk. Nothing on the main thread may import any of them - `analyze-client.ts` is the boundary, and it is only ever reached through `await import()`. `vfile-message-to-issue.ts` is retext-free on purpose, so the mapping is reachable without the stack.

Two readability passes, not one: `unified` _merges_ the options of a plugin used twice on the same processor, so the two severity tiers need a processor each over one shared parse. The tiers are set six years apart because the seven algorithms bucket coarsely - at four years they flag an identical set and separate nothing.

Adding a rule means four places after the id in `src/shared/messages.ts`: its label in `RULES` (`rules.ts`), its plugin in `RULE_PLUGINS` (`word-issues.ts`) and its message `source` in `RULE_SOURCES` (`vfile-message-to-issue.ts`), and a test. All three maps are `Record<TextToolRuleId, …>` so none compiles until updated - `RULE_SOURCES` in particular is declared id-to-source and reversed at runtime, because keyed the other way a missing entry typechecks and the rule silently reports nothing.

#### Content Management

- `src/hooks/use-content.ts` - Fetches the standalone web app's demo notes from `public/`. They sit there so their images are reachable by URL; `import.meta.glob` cannot see into `public/`, hence the hardcoded file list
- `src/hooks/use-settings.ts` & `src/hooks/use-theme.ts` - React contexts and their accessor hooks, kept out of the provider files so each `.tsx` exports exactly one component
- `src/lib/update-notes.ts` - The standalone save path, and a stub: edits in the web build are logged, not persisted

#### UI Components (`src/components/`)

- Built with Radix UI primitives and shadcn/ui patterns
- `dev-file-selector.tsx` - File selector dropdown, dev-only
- `content.tsx` - Layout: renders the toolbar and `note-body.tsx`, which picks the raw markdown textarea or the TipTap editor. `src/hooks/use-note-source.ts` picks the content source (VSCode vs. local)
- `raw-markdown-editor.tsx` - The raw view, which saves the file **verbatim, frontmatter included**, because it shows the whole file. `use-note-save.ts` is the debounce and Cmd/Ctrl+S path both it and the TipTap editor share; the frontmatter split is the TipTap side's business and has already happened by the time text reaches that hook
- `app-error-boundary.tsx` - Every failable seam wraps in this. A boundary must report explicitly (`report-error.ts` → `console.error` → the log bridge): the startup watchdog only fires while `#root` is empty, and a rendered fallback fills it. The mermaid boundary has to sit in `src/editor/code-block-view.tsx` rather than around the editor, because TipTap mounts each node view as its own React root
- `toolbar.tsx` - Top toolbar (file selector, raw/full-width/text-tools toggles, theme toggle). The `ToggleGroup` rebuilds every key from the selected array, so both directions are derived from the one table in `view-toggle-options.ts` - a toggle listed in only one of them used to be silently reset the next time any other was used
- `settings-provider.tsx` - Single source of truth for `viewOptions` (user toggles) and `settings` (VSCode configuration). In VSCode it seeds from `window.initialConfig`, posts `setViewOptions` to the host, and re-renders on `config` broadcasts; standalone it falls back to `localStorage`. Its `isVSCodeContext` is the app's only answer to that question, and is derived synchronously from `window.vscode` — anything deriving it in an effect reports `false` on the first render, which is long enough to send a save down the wrong path.
- `theme-provider.tsx` & `theme-toggle.tsx` - Dark/light theme system; the theme lives in `viewOptions`, so it persists alongside the other toggles
- `ui/` - Reusable UI components following shadcn/ui conventions

`App.tsx` is composition only: `SettingsProvider` → `ThemeProvider` → `Content`.

**One exported component per file.** `react/only-export-components` is enabled (off for `src/components/ui/**`), so contexts and hooks live in `src/hooks/` (`use-settings.ts`, `use-theme.ts`) and the matching `*-provider.tsx` files export only the provider component.

#### Extension Settings

Contributed under the `editorMarkdownNotes` section in `package.json` (`contributes.configuration`, which is also what surfaces the cog → Settings entry on the extension page). Persisted view options live in `context.globalState` under `editorMarkdownNotes.viewOptions` and are broadcast to every open webview panel, so tabs stay in sync. The `toggleRaw` / `toggleFullWidth` / `toggleTextTools` / `selectTheme` commands drive the same state from the command palette, gated on `activeCustomEditorId`.

#### Bundle chunks

**Three things keep the split bundle loadable in the webview; break one and the panel loads blank.** `base: './'`, because root-absolute chunk URLs point outside the extension under a `vscode-webview://` origin. `${webview.cspSource}` in `script-src`, because the entry script's nonce is not inherited by the modules it imports. And `build.manifest`, which `readEntryChunk` reads to find the hashed entry.

#### Validation

`src/lib/schemas.ts` holds the zod schemas for everything the webview receives from outside itself (localStorage, host `config` messages). Every field uses `.catch()`, so parsing degrades to a default rather than throwing and blanking the editor.

**Keep zod out of the extension host.** The `.vsix` is packaged with `--no-dependencies`, so `node_modules` is not shipped and anything `src/extension.ts` requires at runtime must be dependency-free. The host merges over `DEFAULT_SETTINGS` / `DEFAULT_VIEW_OPTIONS` instead.

### File Organization

- `public/*.md` - Demo notes, one per image-resolution rule; kept out of the `.vsix` by `.vscodeignore`

## Important Notes

- The editor auto-saves with 1000ms debounce using `useDebounceValue`
