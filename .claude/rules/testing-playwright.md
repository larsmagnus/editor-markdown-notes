---
paths:
  - '**/*.spec.*'
---

# Playwright Testing Rules

- Import `test`/`expect` from `@/e2e/lib/fixtures` when a spec needs to use `pressKeySettled`/`actionSettled`
- Use `pressKeySettled(page, key)` instead of `page.keyboard.press(key)` for any key that can move the caret or selection (arrows, Home/End, Backspace/Delete, Enter) - Playwright's synthetic keys can outrun ProseMirror's DOMObserver, and a raw `press()` races that
- Use `actionSettled(page, action)` to wrap any other action (a click, a multi-key sequence) that changes the selection
- Use `selectSubstring(locator, needle)` to select text directly via Range/Selection instead of walking there with repeated arrow-key presses
- Use `tabUntilFocused`/`focusedElementSignature` for Tab-order assertions instead of raw `page.keyboard.press('Tab')` loops
