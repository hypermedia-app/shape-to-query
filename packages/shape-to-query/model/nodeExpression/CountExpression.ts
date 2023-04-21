import { Term } from 'rdf-js'
import { GraphPointer } from 'clownface'
import { sh } from '@tpluscode/rdf-ns-builders/loose'
import { isBlankNode, isGraphPointer } from 'is-graph-pointer'
import { SELECT } from '@tpluscode/sparql-builder'
import { ModelFactory } from '../ModelFactory.js'
import { NodeExpression, Parameters } from './NodeExpression.js'
import { getOne, getOneOrZero } from './util.js'

export class CountExpression implements NodeExpression {
  static match(pointer: GraphPointer) {
    return isBlankNode(pointer) && isGraphPointer(getOneOrZero(pointer, sh.count))
  }

  static fromPointer(pointer: GraphPointer, createExpr: ModelFactory) {
    return new CountExpression(pointer.term, createExpr.nodeExpression(getOne(pointer, sh.count)))
  }

  constructor(public readonly term: Term, public expression: NodeExpression) {
  }

  buildPatterns(arg: Parameters) {
    const object = arg.variable()

    const where = arg.builder.build(this.expression, arg)

    return {
      object,
      patterns: SELECT`(COUNT(${where.object}) as ${object})`
        .WHERE`${where.patterns}`,
    }
  }
}
