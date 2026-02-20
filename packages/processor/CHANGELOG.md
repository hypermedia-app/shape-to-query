# @hydrofoil/sparql-processor

## 0.2.2

### Patch Changes

- 6c72915: Update package `files` meta

## 0.2.1

### Patch Changes

- b28cc8c: Relax the return type of `ProcessorImpl#processFunctionCall`

## 0.2.0

### Minor Changes

- 5a07b3d: The query processor methods now allow returning arrays, which may break extending classes

### Patch Changes

- 9f043d4: Allow transforming triple to another type of pattern

## 0.1.5

### Patch Changes

- 145b6d8: Handle undefined `graph` property of INSERT/DELTE statement

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
