---
paths:
  - '**/*.test.*'
---

# Vitest Testing Rules

- When creating OR exporting/refactoring an existing pure utility function with significant logic, proactively add unit tests — treat the export as the trigger, not just creation
- Never add factory helper functions to tests — inline data directly in each test case. Keep tests WET.
- The editor is the exception: build one with `createEditor` from `#src/test-utils/editor`, never `new Editor(...)`. `saved` and `press` live there too
- Never destroy an editor or write an `afterEach` for one. `src/test-setup.ts` does it globally, because a leaked editor fails an unrelated file on CI rather than its own
- `createEditor` loads markdown through `loadNoteContent`, as the app does (HTML and JSON content through `setContent`); `openNote` loads any text as a note, `<` and all. `{ parseOnly: true }` is the constructor parse — a different document, so adding or dropping it changes what the test says
- Property tests take `numRuns: fuzzRuns(n)`; `pnpm test:fuzz` runs them deep with a fresh seed, and `FUZZ_SEED` replays one. Reuse one editor across a property's runs - thousands of them outlive the heap
