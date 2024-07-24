import { sh } from '@tpluscode/rdf-ns-builders'
import type sparqljs from 'sparqljs'
import type { ShapePatterns } from '../lib/shapePatterns.js'
import { emptyPatterns, flatten, union } from '../lib/shapePatterns.js'
import type { FocusNode } from '../lib/FocusNode.js'
import type { VariableSequence } from '../lib/variableSequence.js'
import type { ConstraintComponent } from './constraint/ConstraintComponent.js'
import type { OrConstraintComponent } from './constraint/or.js'
import type { AndConstraintComponent } from './constraint/and.js'

export interface BuildParameters {
  focusNode: FocusNode
  variable: VariableSequence
  rootPatterns: sparqljs.Pattern[]
}

export interface Shape {
  constraints: ReadonlyArray<ConstraintComponent>
}

export default class {
  constructor(public readonly constraints: ReadonlyArray<ConstraintComponent>) {
  }

  buildLogicalConstraints({ focusNode, variable, rootPatterns }: BuildParameters): ShapePatterns {
    if (!this.constraints.length) {
      return emptyPatterns
    }

    const sum = this.constraints
      .filter((l): l is AndConstraintComponent => l.type.equals(sh.AndConstraintComponent))
      .flatMap(l => l.inner.map(i => i.buildPatterns({ focusNode, variable, rootPatterns })))
      .filter(Boolean)

    const alternatives = this.constraints
      .filter((l): l is OrConstraintComponent => l.type.equals(sh.OrConstraintComponent))
      .map(l => union(...l.inner.map(i => i.buildPatterns({ focusNode, variable, rootPatterns }))))
      .filter(Boolean)

    return flatten(...sum, ...alternatives)
  }
}
