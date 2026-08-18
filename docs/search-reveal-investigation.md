# Revealing a VSCode search match in the custom editor

Running notes. Update as things are tried.

## The problem

Search for `<input` in the sidebar, click the `public/other-note.md` result. Expected: the
note opens with line 67 near the middle of the viewport and `<input` highlighted. Actual:
the note opens at whatever scroll offset it was last left at, with nothing highlighted.

This has to coexist with scroll persistence (`ScrollPositionStore`, `restore-scroll-top.ts`):
a note not yet seen this session opens at the top, one seen before reopens where it was left.
A reveal has to win over that restore without breaking the ordinary case.

## The constraint

`workbench.editorAssociations` maps `*.md` to this extension, so a search result resolves
straight to the custom editor. VSCode hands custom editors nothing positional, and the
selection the search view asks for is dropped on that path.

Measured, not inferred — see `src/test/search-reveal-probe.test.ts`:

- `resolveCustomTextEditor(document, webviewPanel, token)` is the entire signature. Reflecting
  over every own **and inherited** key of the panel yields `_store, onDidDispose,
onDidChangeViewState, dispose, webview, viewType, title, iconPath, options, viewColumn,
active, visible, _updateViewState, reveal, assertNotDisposed, _register`. No selection.
- `TabInputCustom` carries `uri` and `viewType` only.
- `visibleTextEditors` is `[]` — there is no `TextEditor` to read a selection from, so
  `onDidChangeTextEditorSelection` never fires.
- A search-driven open and an ordinary open are byte-identical from inside the extension.

### What fires on a reveal — settled by a human clicking

This section was written twice and wrong once. The record matters more than the conclusion.

First reading: "revealing an already-open tab raises nothing", from an automated run.
Then a "correction": preview tabs re-run the provider, pinned tabs raise
`onDidChangeViewState`, based on two `resolveCustomTextEditor` entries in the probe log.

**The correction was wrong.** Those two entries sat 37 seconds apart, spanning a
`suiteTeardown` that closes all editors — so they were two _first_ opens, not a first and a
second. The tab had been closed in between. Reading a shared log across suites as if it were
one timeline is what produced it.

A human clicking real search results settles it. Clicking a result for a note **not currently
open** resolves the provider, and the match reads back exactly:

```
+13ms  resolveCustomTextEditor  one-match.md
+193ms focusedSearchMatch@resolve {"line":21,"column":1,
         "lineText":"\t<input id=\"email\" name=\"email\" type=\"email\" required />"}
```

Then, clicking further matches **inside a note already open** — several times, preview tab and
pinned tab alike — produced, in full: nothing. No `resolveCustomTextEditor`, no
`onDidChangeViewState`, no tab event. Pinning the tab raised one `onDidChangeTabs`; the clicks
after it raised nothing at all.

`onDidChangeViewState` never fires because focusing the search sidebar does not change the
_active editor_ — the panel stays active throughout, so there is no state change to report.

| Situation                                | Signal                    | Reveal possible           |
| ---------------------------------------- | ------------------------- | ------------------------- |
| Note not currently open                  | `resolveCustomTextEditor` | Yes, with the exact match |
| Note already open, another match clicked | None                      | No                        |

So the reveal can only fire when a note opens. That covers the reported bug, which is a note
being opened from search. Re-clicking a different match in a note already on screen is not
detectable, and no amount of event subscription changes that — the workbench simply tells
extensions nothing.

## What works

Two search-view commands, both stable command ids (not proposed API):

| Command                          | Returns                                                                           | Clipboard? |
| -------------------------------- | --------------------------------------------------------------------------------- | ---------- |
| `search.action.getSearchResults` | The whole result set, grouped by absolute path, `line,column: lineText` per match | No         |
| `search.action.copyMatch`        | The **focused** match alone, same `line,column: lineText` shape                   | Yes        |

Both are 1-based on line and column; `search-match.ts` converts to the 0-based positions the
API uses.

`getSearchResults` output:

```
/Users/…/public/other-note.md
  67,2: 	<input id="email" name="email" type="email" required />
```

Stepping focus through results and reading `copyMatch` each time distinguishes two matches
sharing one line:

```
focus 1: "8,2:  \t<input … /><input id=\"second\" />"
focus 2: "8,57: \t<input … /><input id=\"second\" />"
```

End to end, via `search.action.openResult` — `src/test/search-click-reveal.test.ts`:

```
columns activated in order: [1, 56]
```

Both matches on one line, correctly distinguished. A real mouse click has since been confirmed
to behave identically to `openResult`, so that stand-in was sound.

Note what this does _not_ show: those activations were driven directly, with
`readFocusedSearchMatch` called by the test rather than by a reveal. It proves the two commands
can identify any match — not that the extension is told when to ask. That is the separate
question settled above, and the answer is only on open.

## What does not work

Each of these was tried and measured, not reasoned about.

**Proposed APIs.** `workspace.findTextInFiles` and `findTextInFiles2` exist on the runtime
object but throw without `enabledApiProposals` _and_ `--enable-proposed-api`. Rules them out
for a Marketplace build. Same for `registerTextSearchProvider`.

**Internal commands.** `getCommands(true)` filters internal commands out; `getCommands(false)`
adds only `_executeSelectionRangeProvider`, `_revealTestInExplorer`, and
`_testing.getExplorerSelection`. Nothing exposes search-view state.

**Command return values.** Of the read-only and focus-only search commands, only
`getSearchResults` returns anything. `focusNextSearchResult`, `focusPreviousSearchResult`,
`focusSearchList` and `openResult` all return `undefined`.

**A focus marker in `getSearchResults`.** Output is byte-identical across four different
focus positions, so it cannot say which result is focused.

**Opening via the text editor first.** Reading `TextEditor.selection` works, but requires
`*.md` associated with `default` and an extension-driven reopen. Rejected: it flashes the raw
text editor on every markdown open.

**Intercepting the click.** Keybindings bind keys, and a mouse click on a tree item does not
dispatch through an overridable command. `registerCommand` on an existing id throws.

## The clipboard problem

`copyMatch` answers only through the clipboard, so reading it means save, call, restore.

`vscode.env.clipboard` exposes `readText` and `writeText` **only**. A save/restore therefore
destroys any non-text clipboard content — a copied image, or files copied in Finder — replacing
it with plain text. That is silent data loss on the user's machine, triggered by merely opening
a note. Restoring also leaves a blip in clipboard-manager history.

This is why `copyMatch` should not sit on the ordinary open path.

## Where it stands

`getSearchResults` is clipboard-free and gives every match in the file. `copyMatch` is the only
route to _which_ match was clicked, and it costs the clipboard. So precision and safety trade
off directly, and the sensible shape is to pay for precision only when it buys something:

- No search results for this file → do nothing. Ordinary opens never touch the clipboard.
- Exactly one match in this file → `getSearchResults` alone already identifies it. Reveal it.
  Still no clipboard.
- More than one match → only here is the focused match ambiguous, and only here is `copyMatch`
  worth its cost. Gate it behind a setting, defaulting off, so the clipboard is never touched
  without the user having asked.

Verified in `src/test/search-clipboard-free.test.ts` (`readSearchMatches` /
`readOnlySearchMatch`), against the repo's own fixture notes:

- Searching `<input` identifies `other-note.md` line 67 column 2 — **the exact reported bug** —
  and asserts the clipboard still holds what was there before.
- Searching `email` finds several matches in that note, and the clipboard-free path declines to
  guess rather than revealing the wrong one.
- A search matching nothing yields nothing, which is the ordinary open.

So the reported case is fixable with no clipboard access at all. The clipboard is only ever
needed for the narrower "several matches in one note, tell me which" case.

Unresolved: whether that default is the right call, or whether multi-match precision matters
enough to make the clipboard read the default.

### Avoiding the clipboard entirely

`copyMatch` only ever adds one thing: _which_ match was clicked. Revealing every match in the
note and scrolling to the first needs no focused match — only each match's start, which
`getSearchResults` already gives, and its length, which it does not.

`search-query.ts` derives that length as the longest common prefix of each match's line from
its column onwards. It is an **upper bound, never a measurement**: `Email addresses` and
`the email field` agree on `email ` including the space, giving 6 for a 5-character query. More
matches, especially from unrelated files, shrink it towards the truth, and it can never come
out shorter than the query. A highlight may therefore run a character or two long.

That is the whole trade: a highlight that occasionally overshoots, against never touching the
user's clipboard. Overshoot looks like a slightly wide highlight; the clipboard cost is silent
data loss.

### Stale results

Neither command says _when_ the search ran. `getSearchResults` keeps returning the last
search's results for as long as the view holds them, so a note opened much later — by any
route, with the search view long forgotten — still looks like a search hit and would be
revealed and highlighted out of nowhere.

Observed live, not predicted. Opening this very document while a `<input` search was still in
the view produced:

```
focusedSearchMatch@resolve {"line":6,"column":12,
  "lineText":"Search for `<input` in the sidebar, click the `public/other-note.md` result…"}
```

A note opened for unrelated reasons reported a confident, wrong match.

So "this file has a match" cannot be the whole trigger. The reveal needs to fire at most once
per search-result activation: remember the last revealed `{uri, line, column}` and skip a
repeat, or arm on a resolve or view-state change and disarm immediately after.

Worth keeping in proportion, though: VSCode's own search results go stale the same way, and
its find widget re-highlights against an old query too. Matching that behaviour is acceptable;
this only needs to avoid being noticeably worse.

## How the wrong answers happened

Three confident wrong claims came out of this investigation. They share a cause worth naming,
because it will recur.

**"There is no stable API for this."** Drawn from `vscode.d.ts` and remembered documentation.
But command ids are not in the type system _at all_ — `search.action.getSearchResults` is a
first-class capability with no type, no declaration, and no doc page. Reading types can only
ever enumerate the typed surface.

**"The public command list is the command list."** `getCommands(true)` reads as "give me
everything"; the argument is `filterInternal`. The habit of trusting a parameter's apparent
meaning over its documented one.

**"Revealing an open tab fires nothing."** Measured with an instrument that could not detect
the answer — `resolveCustomTextEditor` is a callback, not an event, so subscribing to events,
even all 43, was looking in the wrong place. A negative result is only as strong as the
instrument's reach.

**The correction to that, which was also wrong.** Two log entries 37 seconds apart were read as
consecutive activations; a `suiteTeardown` closing all editors sat between them, making both
_first_ opens. Reading a shared, append-only log across suite boundaries as one timeline. The
fix is a per-scenario log, or a human driving the real UI — which is what finally settled it.

The correction in each case: enumerate the live runtime, and prefer a probe that would show the
thing if it were there. Reflecting over API objects for undeclared properties, listing commands
unfiltered, and hooking events by enumeration rather than by guess all came from that.

Not everything survives this treatment. Whether a _mouse click_ focuses a result the way
keyboard navigation does is still untested — `search.action.openResult` is a close proxy, not a
click.

## Rules this produced

Applied, scoped to the failures above:

- `.claude/rules/testing.md` — `src/test/**` launches a real VS Code; host behaviour cannot be
  inferred from `vscode.d.ts`. Also the probe rule: instrumentation is deleted once it has
  answered its question, or left off behind a flag and exercised by a suite. Durable
  observability that serves users at runtime is not a probe and needs no flag.
- `.claude/rules/vscode-api.md` (new) — command ids are untyped, `getCommands(false)` is the
  unfiltered list, the typings lag the runtime, and a negative result is only as strong as its
  instrument.
- `CLAUDE.md` — one clause naming `pnpm test:extension`.

`src/test/probe-support.ts` is shared setup inside `src/test/**`, which the amended rule allows
where a suite would otherwise breach the complexity cap. That is exactly why it exists.

## Verifying

```sh
pnpm vscode:compile && npx vscode-test        # integration, real VSCode 1.133.0
npx vitest run src/extension/search-match.test.ts src/extension/search-query.test.ts
```

Suites, all in `src/test/`:

- `search-clipboard-free.test.ts` — the path meant to run on every open, asserting the
  clipboard is untouched.
- `search-click-reveal.test.ts` — activating a result end to end, both matches on one line.
- `search-reveal-events.test.ts` — every runtime event raised by a reveal.
- `search-return-values.test.ts` — the clipboard-free hypotheses above.
- `search-reveal-probe.test.ts` — what a selection-carrying open delivers to the provider.
- `search-api-surface.test.ts` — runtime commands, internal and public.

### The probe flag

The instrumentation is inert unless `EMN_PROBE` is set (`probe-enabled.ts`), so a normal
session subscribes to nothing, reflects over nothing, and writes nothing. `.vscode-test.mjs`
sets it, which is what keeps the probe exercised instead of rotting.

That flag applies to the whole extension host, not one suite, so the probe reads matches the
**clipboard-free** way. An earlier version called `readFocusedSearchMatch` on every panel
resolve, which raced itself — two overlapping calls each save the blank the other wrote and
restore _that_ — and blanked the clipboard mid-assertion in `search-clipboard-free.test.ts`.
`readFocusedSearchMatch` is now single-flight and called only where a test asks for it.

For a manual run against a real window:

```sh
EMN_PROBE=1 code --extensionDevelopmentPath="$PWD" /path/to/some/notes
```

It logs to the _Editor Markdown Notes_ output channel and appends to
`$TMPDIR/emn-reveal-probe.log`. Point the dev host at a folder that is **not** already open in
another window, or it silently opens empty.

### Settled by hand

A real mouse click was confirmed to behave exactly like `search.action.openResult`, and the
already-open case was settled the same way — see the reveal section above. Anything else that
turns on _when_ the workbench notifies an extension needs a human and `EMN_PROBE=1`; automated
activation cannot stand in for it, because driving a command is not the same as the workbench
deciding to tell you something.

## A line number is not an editor line

`splitFrontmatter` (`src/lib/frontmatter.ts`) strips YAML frontmatter before `setContent`, and
its pattern consumes the closing fence plus **nought to two** trailing newlines. So the offset
between a source line and the editor's own line is real and variable — in `other-note.md`,
frontmatter runs to line 7 and the reported match at source line 67 is body line 59.

Search reports source lines. Anything mapping one to a position has to subtract the lines
`splitFrontmatter` ate, which means it should return that count rather than leaving each caller
to recompute it.

## The plan

Moved to `docs/search-reveal-plan.md`, so this file stays a record of what was measured.

## Code status

Meant to survive: `search-match.ts`, `search-query.ts`, `read-search-match.ts` and their unit
tests.

Instrumentation, inert unless `EMN_PROBE` is set: `reveal-probe.ts`, `probe-listeners.ts`,
`probe-panel.ts`, `probe-all-events.ts`, `reveal-probe-describe.ts`, `probe-enabled.ts`, and
the probe suites with `probe-support.ts`. Worth keeping while the design is unfinished — it is
how any of the above gets re-checked against a new VSCode build. Delete it when the feature
ships, or when a VSCode upgrade makes re-verification cheaper than the code costs.
