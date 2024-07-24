---
"@hydrofoil/shape-to-query": minor
---

Added optimization which removes unnecessary parts of `UNION` clauses if the same patterns are wholly used in outer scope (re https://github.com/zazuko/cube-hierarchy-query/pull/37). If only one pattern or group remains, the `UNION` is converted to an `OPTIONAL`.
