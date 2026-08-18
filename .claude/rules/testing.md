---
paths:
  - '**/*.test.*,**/*.spec.*'
---

# Testing Rules

- Use @agents/test-architect for writing or reviewing tests
- `src/test/**` runs a **real VS Code** (`pnpm test:extension`). Extension host, custom editor and VS Code API behaviour is tested there, never inferred from `vscode.d.ts`
- Unit tests are vitest (`pnpm test:unit`), excluding `src/test/**`
- No test-only utilities in production code. Shared setup inside `src/test/**` is fine
- A probe is instrumentation answering a question: delete it once answered, or flag it off by default and cover it with a suite. Runtime observability (the webview log bridge) is not a probe
