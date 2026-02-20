# @hydrofoil/shape-to-query

## 0.15.1

### Patch Changes

- 6c72915: Update package `repository` meta
- Updated dependencies [6c72915]
- Updated dependencies [6c72915]
  - @hydrofoil/sparql-processor@0.2.2

## 0.15.0

### Minor Changes

- 5a07b3d: The query processor methods now allow returning arrays, which may break extending classes

### Patch Changes

- 49fe2af: Update RDF/JS-related packages
- Updated dependencies [5a07b3d]
- Updated dependencies [9f043d4]
  - @hydrofoil/sparql-processor@0.2.0

## 0.14.0

### Minor Changes

- fbc9768: The class abstract `NodeExpression` now requires the expression term as argument

### Patch Changes

- fbc9768: Function expressions were incorrectly cached and reused, causing incorrect, or even invalid SPARQL

## 0.13.11

### Patch Changes

- 7be9ec6: Using `sh:or` with `sh:node` to constrain a property generated wrong patterns
- 7be9ec6: When using `sh:node` to constrain a property, properties without any additional constraints should not generate query patterns

## 0.13.10

### Patch Changes

- 83f0b91: Exists Expression (fixes #23)
- da2092c: If Expression (fixes #24)

## 0.13.9

### Patch Changes

- 200b1f3: Added switch to generate query without prefixes

## 0.13.8

### Patch Changes

- 1629a49: In case of small shapes, a double (nested) `OPTIONAL` would be generated

## 0.13.7

### Patch Changes

- afe19e7: build(deps): bump ts-pattern from 5.2.0 to 5.6.0
- 108f96f: In some cases Triple Rules could produce empty groups in `UNION`
- Updated dependencies [afe19e7]
  - @hydrofoil/sparql-processor@0.1.4

## 0.13.6

### Patch Changes

- f4fc608: Node Expressions which only produce a constructed terms are inlined into the `CONSTRUCT` clause
- abf4a0a: build(deps): bump @tpluscode/rdf-string from 1.3.3 to 1.3.4

## 0.13.5

### Patch Changes

- 6b83456: When SPARQL constraints generated blank nodes, the exact same blank nodes could be used in the query multiple times, causing invalid SPARQL queries. This change ensures that blank nodes are unique within the query, preventing such issues.
- Updated dependencies [6b83456]
  - @hydrofoil/sparql-processor@0.1.3

## 0.13.4

### Patch Changes

- 9e3d57a: Count expression must always use aggregated value as object

## 0.13.3

### Patch Changes

- cf95df3: No unnecessary `BIND` when object is focus node (variable)
- 33dde9d: Some patterns would not be removed from `UNION`
- cf95df3: `sh:count` combined with `sh:disctinct` now produces `COUNT( DISTINCT )` instead of nested subselects
- cf95df3: Subquery in TripleRule was not wrapped in a group pattern, generating invalid SPARQL syntax

## 0.13.2

### Patch Changes

- f94f592: `sh:deactivated false` in any experssion caused Expression Constraint to fail
- 6f86062: Added range constraints (`sh:minInclusive`, `sh:minExclusive`, `sh:maxInclusive` and `sh:maxExclusive`) (closes #49)
- 6f86062: Added `sh:datatype` (closes #46)
- Updated dependencies [69ef993]
  - @hydrofoil/sparql-processor@0.1.2

## 0.13.1

### Patch Changes

- 3f7d281: Optimisers missing from package

## 0.13.0

### Minor Changes

- 5afc6e5: Added optimization which removes unnecessary parts of `UNION` clauses if the same patterns are wholly used in outer scope (re https://github.com/zazuko/cube-hierarchy-query/pull/37). If only one pattern or group remains, the `UNION` is converted to an `OPTIONAL`.
- c6a69e9: Use `sparqljs` for internal representation

### Patch Changes

- Updated dependencies [c6a69e9]
- Updated dependencies [c6a69e9]
- Updated dependencies [c6a69e9]
  - @hydrofoil/sparql-processor@0.1.0

## 0.12.0

### Minor Changes

- e4991e9: Added a required field `rootIsFocusNode` to `NodeExpression`

### Patch Changes

- e4991e9: Added general support for Custom Targets in code (not yet possible to inject own implementations)
- e4991e9: Subqueries now only select the one variable when it's the Focus Node itself
- e4991e9: Added a custom target `Node Expression Target`
- e4991e9: Order By Expression incorrectly bound return variables

## 0.11.2

### Patch Changes

- 23ee904: Using the environment without dependency on streams
- 5368d99: Remove usages of `rdf-js`

## 0.11.1

### Patch Changes

- 5386bc2: build(deps): bump @vocabulary/dash-sparql from 1.0.1 to 1.0.4

## 0.11.0

### Minor Changes

- ae800dc: Update `sparql-http-client` to v3

### Patch Changes

- 180f85b: Update `@tpluscode/rdf-string` to `v1.3.1`
- ae800dc: Built with `moduleResolution=NodeNext`
- 08010b8: build(deps): bump @vocabulary/dash from 1.0.1 to 1.0.4
- 180f85b: Updated `@tpluscode/sparql-builder` to `v2.0.3`

## 0.10.0

### Minor Changes

- f4ed155: Massive performance improvement achieved by reducing nesting on `sh:node` with the use of a union of subqueries
- 7b337cc: Added a `requiresFullContext` to control node expressions which need the full path from targets when rendered in a `UNION`

### Patch Changes

- 52f18ab: build(deps): bump @vocabulary/sh from 1.0.1 to 1.1.3
- 8b10285: Avoid equality `FILTER` in the implementation of `sh:hasValue` which would produce unexpected results.

## 0.9.4

### Patch Changes

- 956bd42: Support simple inverse paths in property value rules
- 1f744c3: Updated dependencies:

  1. `@zazuko/env` to `2.0.3`

## 0.9.3

### Patch Changes

- 11d9a15: Export `PropertyShape`, `NodeShape`, `Options`, and `ShapePatterns` from `@hydrofoil/shape-to-query`
- 882b13f: Allow changing the implementation of `NodeShape`, `PropertyShape` and `PropertyValueRule`
- 882b13f: Add top-level module exporting constraints

## 0.9.2

### Patch Changes

- 8a19d88: Improve performance of shapes with deep `sh:node` constraints

## 0.9.1

### Patch Changes

- dfb97f6: `sh:languageIn` should also be applied to `NodeShape` so that it works with `sh:filterShape`

## 0.9.0

### Minor Changes

- d1a8688: Change the abstract methods of constraint components to separate property shape and node shape constraints
- b2e09e5: Base `ConstraintComponent` class is now default-exported

### Patch Changes

- d20ee22: Use `@zazuko/env` instead of `rdf-ext`
- d1a8688: When used in node shape, class constraint would produce an incorrect pattern
- 8846775: Fix `sh:nodeKind` usage in node shape
- 78ca7bf: Added `sh:languageIn` constraint (closes #52)

## 0.8.1

### Patch Changes

- 42023e0: chore: add homepage
- 9a8b95c: Include changelog in package
- 6560203: Function expression did not work for arbitrary IRI which was not explicitly annotated as `sh:Function`

## 0.8.0

### Minor Changes

- fa27d67: Added the ability to create custom rules. The method `ModelFactory#tripleRule` has been renamed to `ModelFactory#rule`
- 4d991f0: Reuse variable between constraints. This should not be a breaking change, aiming at improving the performance of the queries, but since it does alter the output of existing constraints, I would advise caution

### Patch Changes

- 4d991f0: Implemented NodeKind Constraint Component (closes #47)
- d333a0b: Missing `main` field
- fa27d67: Remove unnecessary bind when using `sh:filterShape` without `sh:nodes`
- 4d991f0: Implemented Class Constraint Component (closes #45)
- fa27d67: Added a custom rule type `s2q:SPORule` which allows selecting all properties from a focus node

## 0.7.1

### Patch Changes

- 2129d19: Optional expression (`s2q:optional`)
- 985d70c: Implemented Distinct Expression (`sh:distinct`) (closes #31)
- 7a093e4: Expression Constraint (`sh:expression`) (closes #130)

## 0.7.0

### Minor Changes

- 2ed19d7: Change the factory method of constraint components to take the property shape a parameter

### Patch Changes

- 2ed19d7: Implemented `sh:PatternConstraintComponent` (closes #51)
- ff5e230: Updated `@vocabulary/dash-sparql` and `@vocabulary/sh` to v1
- 10b8086: build(deps): bump @vocabulary/dash from 1.0.0-rc.0 to 1.0.0
- b92e41f: Re-export `sparql` template function

## 0.6.1

### Patch Changes

- e19ba69: Better query performance when constraints and rules are unioned

## 0.6.0

### Minor Changes

- 5e84e89: Changed signature of `NodeExpression#buildPatterns` and renamed to simple `build`

### Patch Changes

- 5e84e89: By reversing the order in which node expression variables are generated, it is possible to connect the expressions of a rule which avoids potential nasty cartesian products
- 158e4a3: build(deps): bump @zazuko/prefixes from 1.0.0-rc.2 to 1.0.0

## 0.5.3

### Patch Changes

- 6af1eb9: Disabling logical constraint shapes with `sh:deactivated true`
- f1ffab7: Property value rules need to access root patterns in their scope
- f1ffab7: When there were multiple rules they would not match anything because of SPARQL's inside-out processing logic

## 0.5.2

### Patch Changes

- efe6224: Implement triple rules (closes #133)
- f855654: Add option to render expressions inlined. For now, used in focus node, constant term and function expressions
- c5b50b4: Update @zazuko/prefixes
- 59d7872: Update is-graph-pointer to v2
- e7d6bfe: Implement SHACL Functions (closes #128, closes #80)

## 0.5.1

### Patch Changes

- 2ab7688: Missing many modules in package

## 0.5.0

### Minor Changes

- fd873ab: Package is now ESM-only
- 47032e6: This is a big internal refactoring which streamlines the handling of targets and constraints, making the library easily extensible

### Patch Changes

- c3addda: When `sh:hasValue` has a single object, a simple equality filter will be used in query
- 97a64fb: Implemented Filter Shape Expression (closes #25)
- 46fe5f2: Support Count Expressions (`sh:count`) (closes #32)
- a956b88: `sh:and` constraint (closes #58)
- 5f3b683: Path Expression (closes #27)
- b9aebcf: Added support for subqueries with `sh:limit` (closes #38) and `sh:offset` (closes #39)
- 5066298: Most basic Constant Term Expression
- 7629dec: Support `sh:orderBy` (closes #37)
- 5639825: Focus node expression (closes #22)
- 3274eca: Added support for `sh:or` constraint

## 0.4.0

### Minor Changes

- 3f2fab2: Removed deprecated export `construct`
- 5f42999: Add support for `sh:targetNode`, `sh:targetClass`, `sh:targetSubjectsOf` and `sh:targetObjectsOf` (closes #12)
- e1f0ae6: Reimplement pattern generation using `clownface-shacl-path` visitor
- 5f42999: When the node shape has any `sh:target*` property, the `focusNode` argument of `constructQuery` and `deleteQuery` is ignored

## 0.3.2

### Patch Changes

- 7eb7ae4: Support for `sh:oneOrMorePath` and `sh:zeroOrMorePath`

## 0.3.1

### Patch Changes

- 6737111: Add a builder for `DELETE` queries
- 6737111: Depretcate `construct` export. It will be removed in future breaking release. Use `constructQuery` instead

## 0.3.0

### Minor Changes

- d2d5996: Support for deep `sh:node` which get combined with parent property shapes' paths
- d2d5996: Changed the signature of `shapeToPatterns`. Now it returns an object with functions to create full `CONSTRUCT` and `WHERE` clauses and implements the `Iterable<SparqlTemplateResult>` interface

## 0.2.3

### Patch Changes

- 5792668: `FILTER` was added to the `CONSTRUCT` clause when there were multiple `sh:targetClass`

## 0.2.2

### Patch Changes

- b0f42ce: When there are multiple `sh:targetClass`, add an `IN` filter

## 0.2.1

### Patch Changes

- 28fd6df: Add parameter for the root Focus Node to be used instead of variable
- 28fd6df: Export function to generate a simple `CONSTRUCT`
- a0fbb0d: Does not generate patterns for deactivated Property Shapes

## 0.2.0

### Minor Changes

- abe0fbc: Simplest possible support for predicate paths.
  BREAKING: change the options parameter

## 0.1.2

### Patch Changes

- 0686a29: Unterminated pattern caused invalid SPARQL

## 0.1.1

### Patch Changes

- 2097f3e: Missing JS in published package

## 0.1.0

### Minor Changes

- 990a319: First version. Minimal support only for `sh:targetClass`
