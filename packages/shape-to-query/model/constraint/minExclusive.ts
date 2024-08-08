import type { Literal } from '@rdfjs/types'
import { sh } from '@tpluscode/rdf-ns-builders'
import type { PropertyShape } from './ConstraintComponent.js'
import { RangeConstraintComponent } from './RangeConstraintComponent.js'

export class MinExclusiveConstraintComponent extends RangeConstraintComponent {
  static * fromShape(shape: PropertyShape) {
    for (const value of RangeConstraintComponent.parameterValues(shape, sh.minExclusive)) {
      yield new MinExclusiveConstraintComponent(value)
    }
  }

  constructor(value: Literal) {
    super(sh.MinExclusiveConstraintComponent, value)
  }
}
