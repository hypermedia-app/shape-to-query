# @hydrofoil/shape-to-query

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
