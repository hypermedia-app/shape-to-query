import type { Literal, NamedNode } from '@rdfjs/types'
import { sh } from '@tpluscode/rdf-ns-builders'
import type sparqljs from 'sparqljs'
import type { Parameters, PropertyShape } from './ConstraintComponent.js'
import ConstraintComponent, { assertList } from './ConstraintComponent.js'

export class InConstraintComponent extends ConstraintComponent {
  static * fromShape(shape: PropertyShape) {
    const ins = shape.get(sh.in) || []
    for (const inn of ins) {
      assertList(inn)
      yield new InConstraintComponent(inn.list.map(({ term }) => {
        if (term.termType !== 'NamedNode' && term.termType !== 'Literal') {
          throw new Error(`Unsupported term type ${term.termType} in sh:in`)
        }

        return term
      }))
    }
  }

  constructor(public readonly values: (NamedNode | Literal)[]) {
    super(sh.InConstraintComponent)
  }

  buildNodeShapePatterns(): sparqljs.Pattern[] {
    return []
  }

  buildPatterns({ valueNode }: Parameters): [sparqljs.FilterPattern] {
    return [{
      type: 'filter',
      expression: {
        type: 'operation',
        operator: 'in',
        args: [valueNode, this.values],
      },
    }]
  }
}
