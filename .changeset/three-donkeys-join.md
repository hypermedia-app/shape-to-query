---
"@hydrofoil/shape-to-query": patch
---

When SPARQL constraints generated blank nodes, the exact same blank nodes could be used in the query multiple times, causing invalid SPARQL queries. This change ensures that blank nodes are unique within the query, preventing such issues.
