---
paths:
  - '**/*.ts,**/*.tsx'
---

# Refactoring Rules

- When extracting or moving code, preserve all useful inline comments from the original
- Use `@/*` path aliases for imports — never relative imports between modules
- When creating new pure utility functions, follow TDD and proactively add unit tests
- When moving a type or value to a new module, update all call sites to import from the new source - never add a re-export shim to the old location for backward compatibility
