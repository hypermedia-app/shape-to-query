import type { Variable, Literal, NamedNode } from '@rdfjs/types'
import { sh } from '@tpluscode/rdf-ns-builders'
import type sparqljs from 'sparqljs'
import type { Parameters, PropertyShape } from './ConstraintComponent.js'
import ConstraintComponent from './ConstraintComponent.js'

export class MinInclusiveConstraintComponent extends ConstraintComponent {
  static * fromShape(shape: PropertyShape) {
    const values = shape.get(sh.minInclusive)

    if (values) {
      for (const value of values) {
        if (!('pointer' in value)) {
          continue
        }

        yield new MinInclusiveConstraintComponent(value.pointer.term as Literal)
      }
    }
  }

  constructor(private readonly value: Literal) {
    super(sh.MinInclusiveConstraintComponent)
  }

  buildNodeShapePatterns({ focusNode }: Parameters): sparqljs.Pattern[] {
    return [this.filter(focusNode)]
  }

  buildPropertyShapePatterns({ valueNode }: Parameters): [sparqljs.Pattern] {
    return [this.filter(valueNode)]
  }

  private filter(node: NamedNode | Variable): sparqljs.Pattern {
    return {
      type: 'filter',
      expression: {
        type: 'operation',
        operator: '>=',
        args: [node, this.value],
      },
    }
  }
}
