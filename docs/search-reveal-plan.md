# Revealing a search match — implementation plan

Findings and their evidence live in `docs/search-reveal-investigation.md`. This is what to
build. Read the investigation's constraint section first; several decisions here look arbitrary
without it.

## What ships

Clicking a search result for a markdown note that is **not currently open** opens it scrolled to
the match, with every match of that search highlighted in the note.

Out of scope, because the workbench raises no signal for it: clicking another match in a note
already on screen. Measured, not assumed — see the investigation. Worth a README line.

## Already built and tested

- `src/extension/search-match.ts` — parses `search.action.getSearchResults` and
  `search.action.copyMatch` output into 0-based `{ line, column, lineText }`.
- `src/extension/search-query.ts` — `deriveQueryLength`, an upper bound on the match length.
- `src/extension/read-search-match.ts` — `readSearchMatches` and `readOnlySearchMatch`
  (clipboard-free), plus `readFocusedSearchMatch` — single-flight, and off the default path
  because it costs the clipboard.

## Step 1 — Host: send the reveal

`resolveCustomTextEditor` is the only moment a search click is observable.

- Build `SearchReveal = { matches: { line, column, length }[], target: number }` from
  `readSearchMatches(document.uri)` and `deriveQueryLength`. `target` indexes the match to scroll
  to — the only one when there is one, otherwise the first.
- Subtract the frontmatter line offset (below) so `line` is a **body** line before it leaves the
  host. The webview never sees a source line, and cannot get the subtraction wrong.
- Inject it as a global beside `initialScrollTop` in `webview-document.ts`, so first paint
  already knows where to go. No message for a fresh panel; nothing else reaches the reveal.
- Deliver once, then drop it. A search's results outlive the click, so a note opened later for
  unrelated reasons must not be revealed again.
- Skip everything when the note has no matches, which is the ordinary open.

Extend `splitFrontmatter` to return the number of lines it consumed. Its pattern eats the fences
plus nought to two trailing newlines, so the shift is variable and every caller recomputing it
would be a bug waiting to happen. Unit tests: no frontmatter, frontmatter with one trailing
newline, with two, and frontmatter-only.

Types in `src/shared/messages.ts`, zod schema in `src/lib/schemas.ts` with `.catch()` per field,
matching every other payload the webview receives.

## Step 2 — Webview: find the position

No markdown-source map exists. `document-text.ts` and `syntax-highlight-tokens.ts` are the
nearest prior art, but both flatten _rendered_ text — and `getDocumentText` skips code blocks,
which is where the reported bug lives, so it cannot be reused as is.

Match by text, which needs no source map:

1. Take the needle: `lineText.slice(column, column + length)`.
2. Walk the document collecting text nodes with their positions, **including code blocks**.
3. Find the needle's occurrences; pick by ordinal among matches sharing a source line.
4. Where the needle does not occur — it spanned markdown syntax such as `**` or a link target —
   reveal the enclosing block proportionally and highlight nothing.

Exact whenever the matched text survives rendering, which covers code blocks and plain prose.

Highlighting reuses the pattern in `text-tools-extension.ts`: React owns the pipeline, the
extension draws ranges handed to it through a meta-tagged transaction so autosave never fires,
and `current.map(tr.mapping, tr.doc)` keeps decorations aligned across edits. The highlight
clears on the next edit or click.

Raw mode is separate and simpler: the textarea holds the whole file, frontmatter included, so
the original source offset applies directly with no mapping and no frontmatter subtraction.

## Step 3 — Beat the scroll restore

`restoreScrollTop` re-applies its target every 100 ms for up to 3 s, to survive images, mermaid
and Shiki changing the page height. It settles early on a scroll it did not cause at unchanged
`scrollHeight` — the accommodation for VSCode's find widget — but a reveal landing mid-window
would be fought and then overwritten.

- A reveal **cancels** the restore outright rather than racing it. Where a reveal exists, the
  restore should not start.
- `use-scroll-position.ts` must not record while the reveal is settling, or the revealed offset
  becomes the note's remembered position and the next ordinary open lands on the old match.
- The reveal has the same "page keeps growing" problem the restore was built for, so it needs the
  same re-application treatment rather than a single `scrollIntoView`.

Centre the match rather than merely bringing it into view — the reported expectation is "line 67
in the middle of the viewport".

## Verifying

- Unit: the frontmatter line count, the needle search and ordinal selection, the position
  mapping. Existing parser and length-bound suites already pass.
- Integration (`src/test/**`, real VS Code): opening `other-note.md` from a `<input` search
  delivers a reveal naming body line 59; an ordinary open delivers none; the clipboard is
  untouched throughout.
- By hand, `EMN_PROBE=1`: the actual scroll lands with the match centred and highlighted, and a
  note opened _without_ a search still restores to its remembered offset. Neither is observable
  from a test — happy-dom has no layout engine, which is why `editor.test.tsx` already stubs
  `MenuBubble`.

## Order

Step 1 is independently verifiable and carries no UI risk. Step 2 is the real work. Step 3 is
small but easy to get subtly wrong, and its failure mode — the remembered scroll offset silently
poisoned — is invisible until the next open.
