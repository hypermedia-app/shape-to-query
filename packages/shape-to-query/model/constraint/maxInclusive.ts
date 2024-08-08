import type { Literal } from '@rdfjs/types'
import { sh } from '@tpluscode/rdf-ns-builders'
import type { PropertyShape } from './ConstraintComponent.js'
import { RangeConstraintComponent } from './RangeConstraintComponent.js'

export class MaxInclusiveConstraintComponent extends RangeConstraintComponent {
  static * fromShape(shape: PropertyShape) {
    for (const value of RangeConstraintComponent.parameterValues(shape, sh.maxInclusive)) {
      yield new MaxInclusiveConstraintComponent(value)
    }
  }

  constructor(value: Literal) {
    super(sh.MaxInclusiveConstraintComponent, value)
  }
}
