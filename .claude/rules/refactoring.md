---
paths:
  - '**/*.ts,**/*.tsx'
---

# Refactoring Rules

- When extracting or moving code, preserve all useful inline comments from the original
- Use `@/*` path aliases for imports — never relative imports between modules. The one exception is extension-host code (`src/extension.ts`, `src/extension/**`, `src/test/**`, and the few `src/lib/*` modules listed in `tsconfig.extension.json`), which must use relative imports: `tsc` emits aliases verbatim and the extension dies with MODULE_NOT_FOUND on activation. That tsconfig deliberately has no `paths` mapping, so an alias there fails typecheck rather than at runtime.
- When creating new pure utility functions, follow TDD and proactively add unit tests
- When moving a type or value to a new module, update all call sites to import from the new source - never add a re-export shim to the old location for backward compatibility
