import { sh } from '@tpluscode/rdf-ns-builders'
import { emptyPatterns, union } from '../lib/shapePatterns'
import { FocusNode } from '../lib/FocusNode'
import { VariableSequence } from '../lib/variableSequence'
import { ConstraintComponent } from './constraint/ConstraintComponent'
import type { OrConstraintComponent } from './constraint/or'

export interface BuildParameters {
  focusNode: FocusNode
  variable: VariableSequence
}

export default class {
  constructor(public readonly constraints: ReadonlyArray<ConstraintComponent>) {
  }

  buildLogicalConstraints({ focusNode, variable }: BuildParameters) {
    if (!this.constraints.length) {
      return emptyPatterns
    }

    const alternatives = this.constraints
      .filter((l): l is OrConstraintComponent => l.type.equals(sh.OrConstraintComponent))
      .flatMap(l => l.inner.map(i => i.buildPatterns({ focusNode, variable })))
      .filter(Boolean)

    return union(...alternatives)
  }
}
