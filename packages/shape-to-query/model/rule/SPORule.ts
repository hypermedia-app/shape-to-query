import $rdf from '@zazuko/env/web.js'
import type { GraphPointer } from 'clownface'
import { rdf } from '@tpluscode/rdf-ns-builders'
import type { ShapePatterns } from '../../lib/shapePatterns.js'
import s2q from '../../ns.js'
import type { ModelFactory } from '../ModelFactory.js'
import type { NodeExpression } from '../nodeExpression/NodeExpression.js'
import { ExpressionConstraintComponent } from '../constraint/expression.js'
import type { Rule, Parameters } from './Rule.js'

export class SPORule implements Rule {
  private objectFilters: ExpressionConstraintComponent[]
  private predicateFilters: ExpressionConstraintComponent[]

  constructor(param: { objectFilters?: NodeExpression[]; predicateFilters?: NodeExpression[] }) {
    this.objectFilters = (param.objectFilters || []).map(wrapExpression)
    this.predicateFilters = (param.predicateFilters || []).map(wrapExpression)
  }

  static matches(pointer: GraphPointer) {
    return pointer.term.equals(pointer.has(rdf.type, s2q.SPORule).term)
  }

  static fromPointer(pointer: GraphPointer, factory: ModelFactory) {
    const predicateFilters = pointer.out(s2q.predicateFilter)
      .map(ptr => factory.nodeExpression(ptr))
    const objectFilters = pointer.out(s2q.objectFilter)
      .map(ptr => factory.nodeExpression(ptr))

    return new SPORule({ predicateFilters, objectFilters })
  }

  buildPatterns({ focusNode, variable }: Parameters): ShapePatterns {
    const predicate = variable()
    const object = variable()
    const spo = $rdf.quad(focusNode, predicate, object)
    const predicateFilters = this.predicateFilters
      .flatMap(filter => filter.buildPatterns({
        focusNode: predicate,
        rootPatterns: undefined,
        valueNode: predicate,
        variable,
      }))
    const objectFilters = this.objectFilters
      .flatMap(filter => filter.buildPatterns({
        focusNode: object,
        rootPatterns: undefined,
        valueNode: object,
        variable,
      }))

    return {
      constructClause: [spo],
      whereClause: [
        { type: 'bgp', triples: [spo] },
        ...predicateFilters,
        ...objectFilters,
      ],
    }
  }
}

function wrapExpression(expression: NodeExpression) {
  return new ExpressionConstraintComponent(expression)
}
