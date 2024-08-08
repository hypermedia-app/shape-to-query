import type { Variable, Literal, NamedNode } from '@rdfjs/types'
import { sh } from '@tpluscode/rdf-ns-builders'
import type sparqljs from 'sparqljs'
import $rdf from '@zazuko/env/web.js'
import type { Parameters, PropertyShape } from './ConstraintComponent.js'
import ConstraintComponent from './ConstraintComponent.js'

const operators = $rdf.termMap<NamedNode, string>([
  [sh.MinExclusiveConstraintComponent, '>'],
  [sh.MinInclusiveConstraintComponent, '>='],
  [sh.MaxExclusiveConstraintComponent, '<'],
  [sh.MaxInclusiveConstraintComponent, '<='],
])

export abstract class RangeConstraintComponent extends ConstraintComponent {
  public static * parameterValues(shape: PropertyShape, parameter: NamedNode) {
    const values = shape.get(parameter)

    if (values) {
      for (const value of values) {
        if (!('pointer' in value)) {
          continue
        }

        yield value.pointer.term as Literal
      }
    }
  }

  private readonly operator: string

  constructor(
    type: NamedNode,
    private readonly value: Literal) {
    super(type)
    this.operator = operators.get(type)
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
        operator: this.operator,
        args: [node, this.value],
      },
    }
  }
}
