---
paths:
  - '**/*.test.*'
---

# Vitest Testing Rules

- When creating OR exporting/refactoring an existing pure utility function with significant logic, proactively add unit tests — treat the export as the trigger, not just creation
- Never add factory helper functions to tests — inline data directly in each test case. Keep tests WET.
