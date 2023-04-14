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
    return new CountExpression(createExpr.nodeExpression(getOne(pointer, sh.count)))
  }

  constructor(public expression: NodeExpression) {
  }

  buildPatterns(arg: Parameters) {
    const object = arg.variable()

    return SELECT`(COUNT(${object}) as ${arg.object})`
      .WHERE`${this.expression.buildPatterns({ ...arg, object })}`
  }
}
