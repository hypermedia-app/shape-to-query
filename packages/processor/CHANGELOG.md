# @hydrofoil/sparql-processor

## 0.1.4

### Patch Changes

- afe19e7: build(deps): bump ts-pattern from 5.2.0 to 5.6.0

## 0.1.3

### Patch Changes

- 6b83456: Added overridable method `processSubquery`

## 0.1.2

### Patch Changes

- 69ef993: `DuplicatePatternRemover` not removes exactly equal `OPTIONAL` patterns (but only comparing BGPs)

## 0.1.1

### Patch Changes

- df20a71: Proper packaging of built JS

## 0.1.0

### Minor Changes

- c6a69e9: Added `PrefixExtractor` optimizer
- c6a69e9: Added `DuplicatePatternRemover` optimizer
- c6a69e9: First version. Provides a base no-op query visitor (`Processor` class) which can be used to implement optimizers
