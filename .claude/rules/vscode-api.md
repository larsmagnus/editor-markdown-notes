---
paths:
  - 'src/extension.ts,src/extension/**,src/test/**'
---

# VS Code API Rules

- Command ids are untyped, so `vscode.d.ts` cannot show a capability is missing. Enumerate with `getCommands(false)` — the argument is `filterInternal`, so `true` hides commands
- Typings lag the runtime; reflect over own **and inherited** keys before calling a property absent
- Verify behaviour with a suite in `src/test/**` before designing around it
- A negative result is only as strong as its instrument: `resolveCustomTextEditor` is a callback, not an event, so event subscriptions cannot see it
