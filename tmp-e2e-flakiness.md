# e2e flakiness: caret-dependent specs fail under parallel workers

Temporary doc. Delete once the investigation lands.

## Problem

A handful of Playwright specs on `feat/expand-markdown` fail intermittently,
always in the same way: a keypress lands while `editor.state.selection` is not
yet where the preceding click or arrow key put it, so the key acts at the wrong
position and the assertion sees the wrong document. They pass in isolation and
fail perhaps one run in four in a full-suite run.

Measured on this branch, four consecutive `pnpm test:e2e` runs (89 tests at the
time, 107 now, 1 `test.fixme`): runs 1, 3, 4 fully green; run 2 failed
`e2e/link-reveal.spec.ts:37`. A later run failed two at once
(`backspace-boundaries.spec.ts:30` and `keyboard-navigation.spec.ts:51`) and
the next was green, so the rate rises with the suite rather than being tied to
one spec. A later session reproduced exactly that: one run failed
`backspace-boundaries.spec.ts:30` alone, the next failed
`keyboard-navigation.spec.ts:51` and `link-reveal.spec.ts:37` together, and
each passed both in isolation and on the following full run. Earlier in the
first session
`e2e/keyboard-navigation.spec.ts:51` and
`e2e/backspace-boundaries.spec.ts:30` each failed once and passed on re-run.
`e2e/unformat-by-backspace.spec.ts:64` failed once on a run that took 1.1
minutes rather than the usual 15 seconds, which is the clearest signal that
machine load is the variable: the same spec passes in isolation every time.

`e2e/copy-paste.spec.ts:57` failed once too, on a run where the two specs
before it passed - its click-then-`Home`/`Shift+End` selection is the same
pattern.

No spec has ever failed in isolation. The population so far:
`link-reveal.spec.ts:37`, `keyboard-navigation.spec.ts:51`,
`backspace-boundaries.spec.ts:30`, `unformat-by-backspace.spec.ts:64`,
`copy-paste.spec.ts:57`, `code-block-fence.spec.ts:73`,
`mermaid-source.spec.ts:16` - seven specs, one shared shape.

`mermaid-source.spec.ts:16` is the seventh, and the clearest specimen of the
mechanism: it presses ten `ArrowRight`s and then a `Backspace`, and under load
_every one of the arrows_ is dropped, leaving the Backspace to act at the
block's first character. Three things were tried on it and are worth not
repeating:

- `toBeFocused`, waiting for the collapsed source to render, and waiting for
  the reveal decoration to clear (alternative 5) are all satisfied while the
  editor still will not act on a key. Adding `waitForTimeout(100)` on top took
  it from failing 1 run in 2 to roughly 1 in 7 - the current state.
- Replacing the eleven key presses with a single `page.mouse.click` at
  coordinates measured from a `Range` over the fence tag made it **worse**
  (3 failures in 5 runs). Whatever the editor is catching up on, it drops a
  click the same way it drops a key, so reducing the number of events is not
  the axis that matters.
- The underlying defect - the node view swapping the element the caret is in -
  does **not** reproduce in vitest. TipTap owns the content DOM and re-parents
  the same `<code>` element, so element identity, parent identity and
  attachment are all unchanged across the swap in happy-dom, on the broken code
  as well as the fixed. Only a real browser's selection sees it.

## Why it is not simply "add a wait"

The current mitigation is `await page.waitForTimeout(100)` between presses,
sprinkled through `backspace-boundaries.spec.ts`, `code-block-fence.spec.ts`,
`mermaid-source.spec.ts`, `horizontal-rule.spec.ts` and
`unformat-by-backspace.spec.ts`. It is a guess:
it slows the suite, it does not scale with CPU contention, and it encodes no
actual condition. `backspace-boundaries.spec.ts` still failed once _with_ the
waits in place.

## What is actually going on

ProseMirror's `DOMObserver` batches selection changes that originate in the
DOM — a click, a native arrow key — and flushes them asynchronously.
Playwright's `keyboard.press` returns as soon as the event is dispatched, not
when the editor has read the resulting selection. Under parallel workers the
flush is late often enough to matter. Two further wrinkles seen on this branch:

- **Collapsed syntax breaks caret geometry.** Hidden markdown syntax is
  `display: inline-block; width: 0` (`.syntax-hidden`, see `globals.css`), so
  `Home`/`End` do not always land where a reader would expect. In
  `code-block-fence.spec.ts` a deliberate `End` inside a fence line puts the
  caret mid-word, which is why that test asserts "the tag lost a character"
  rather than naming which one.
- **A click can land at offset 0.** `content.getByText('Above.').click()`
  followed by `End` was observed leaving the caret at the paragraph start, so
  the subsequent `Enter` split above the text rather than below it. That made
  one horizontal-rule test pass for the wrong reason before it was rewritten.

## Where to look

- `playwright.config.ts` — no `workers`, `retries`, `expect.timeout` or
  `trace` configured; the defaults are what the suite runs on.
- `e2e/lib/helpers.ts` — `openInVSCode`, `pasteText`/`pasteHtml`,
  `copySelectionHtml`, `tabUntilFocused`. Any new synchronisation primitive
  belongs here.
- The specs named above are the observed failing population, but the
  shape is shared by every spec that clicks and then presses a key, so treat
  the list as a sample rather than the boundary.

## Alternatives worth evaluating

1. **Assert the editor's own selection before acting.** A helper that polls
   `editor.state.selection.from` through `page.evaluate` until it matches an
   expected position replaces a timeout with a real condition. Needs a handle
   on the editor from the page — check whether one is already exposed for tests
   and, if not, whether exposing one is acceptable (the project rule forbids
   test-only seams in production code, so prefer reading through the DOM).
2. **Place the caret through the editor rather than through the DOM.** Setting
   a text selection programmatically removes the observer round-trip entirely.
   The cost is that it stops testing the click, which for some of these specs
   is part of the behaviour.
3. **Playwright retries plus traces** (`retries: 1`, `trace: 'retain-on-failure'`).
   Does not fix anything, but would turn every future flake into a recorded
   artefact instead of a re-run. Cheap; probably worth doing regardless.
4. **Serialise the caret-sensitive specs** with
   `test.describe.configure({ mode: 'serial' })` or a dedicated project with
   `workers: 1`. Buys stability at the cost of wall-clock time, and hides
   rather than fixes the race.
5. **Wait on a rendered consequence instead of the caret.** Entering a
   construct reveals its syntax, so `await expect(locator('.syntax-hidden'))
.toHaveCount(0)` is an observable, meaningful signal that the editor has
   processed the caret move. Tried in `mermaid-source.spec.ts` and **not
   sufficient on its own**: the decoration clears the moment the selection is
   set, which is earlier than the editor acting on a key. Worth combining with
   (1) rather than treating as a replacement for it.

## Definition of done

Twenty consecutive full-suite runs green with no `waitForTimeout` left in
`e2e/`, and the existing timeouts replaced by conditions that state what they
are waiting for.
