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

export class RangeConstraintComponent extends ConstraintComponent {
  static * fromShape(shape: PropertyShape) {
    for (const constraint of shape.get(sh.minExclusive) ?? []) {
      if (!('pointer' in constraint)) {
        continue
      }
      yield new RangeConstraintComponent(sh.MinExclusiveConstraintComponent, constraint.pointer.term as Literal)
    }
    for (const constraint of shape.get(sh.minInclusive) ?? []) {
      if (!('pointer' in constraint)) {
        continue
      }
      yield new RangeConstraintComponent(sh.MinInclusiveConstraintComponent, constraint.pointer.term as Literal)
    }
    for (const constraint of shape.get(sh.maxExclusive) ?? []) {
      if (!('pointer' in constraint)) {
        continue
      }
      yield new RangeConstraintComponent(sh.MaxExclusiveConstraintComponent, constraint.pointer.term as Literal)
    }
    for (const constraint of shape.get(sh.maxInclusive) ?? []) {
      if (!('pointer' in constraint)) {
        continue
      }
      yield new RangeConstraintComponent(sh.MaxInclusiveConstraintComponent, constraint.pointer.term as Literal)
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

  buildPatterns({ valueNode }: Parameters): [sparqljs.Pattern] {
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
