import { sh } from '@tpluscode/rdf-ns-builders'
import { SparqlTemplateResult } from '@tpluscode/sparql-builder'
import { emptyPatterns, flatten, union } from '../lib/shapePatterns.js'
import { FocusNode } from '../lib/FocusNode.js'
import { VariableSequence } from '../lib/variableSequence.js'
import { ConstraintComponent } from './constraint/ConstraintComponent.js'
import type { OrConstraintComponent } from './constraint/or.js'
import type { AndConstraintComponent } from './constraint/and.js'

export interface BuildParameters {
  focusNode: FocusNode
  variable: VariableSequence
  rootPatterns: SparqlTemplateResult
  rootConstraints?: string | SparqlTemplateResult
}

export interface Shape {
  constraints: ReadonlyArray<ConstraintComponent>
}

export default class {
  constructor(public readonly constraints: ReadonlyArray<ConstraintComponent>) {
  }

  buildLogicalConstraints({ focusNode, variable, rootPatterns, rootConstraints }: BuildParameters) {
    if (!this.constraints.length) {
      return emptyPatterns
    }

    const sum = this.constraints
      .filter((l): l is AndConstraintComponent => l.type.equals(sh.AndConstraintComponent))
      .flatMap(l => l.inner.map(i => i.buildPatterns({ focusNode, variable, rootPatterns, rootConstraints })))
      .filter(Boolean)

    const alternatives = this.constraints
      .filter((l): l is OrConstraintComponent => l.type.equals(sh.OrConstraintComponent))
      .map(l => union(...l.inner.map(i => i.buildPatterns({ focusNode, variable, rootPatterns, rootConstraints }))))
      .filter(Boolean)

    return flatten(...sum, ...alternatives)
  }
}
