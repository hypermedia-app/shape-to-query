---
"@hydrofoil/shape-to-query": patch
---

Support `sh:minCount` and `sh:maxCount` by counting distinct property path values per focus node. Allow absent values when the declared cardinality permits them and enforce value constraints when values are present. Fixes #545 Fixes #48
