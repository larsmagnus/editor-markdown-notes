---
paths:
  - 'src/editor/extensions/**'
---

# Editor Extension Rules

- Every TipTap extension gets its own file suffixed `-extension.ts` (e.g. `image-extension.ts`), registered in `src/editor/extensions/extensions.ts` - never defined inline there via `.extend({...})`.
