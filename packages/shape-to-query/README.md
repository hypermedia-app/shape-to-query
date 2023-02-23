# @hydrofoil/shape-to-query

Generate SPARQL queries from SHACL Node Shapes.

## TL;DR;

```shell
npm i --save @hydrofoil/shape-to-query
```

```ts
import type { GraphPointer } from 'clownface'
import { constructQuery } from '@hydrofoil/shape-to-query'

let shape: GraphPointer

const queryString = constructQuery(shape).build()
```

For full documentation, see https://shape-to-query.hypermedia.app/docs.

## Features

* Targets
  * [x] `sh:target(Class|Node|SubjectsOf|ObjectsOf)`
  * [] SPARQL targets
* Property constraints
  * [] TBD
* Query forms
  * [x] `CONSTRUCT`
  * [x] `DELETE`
