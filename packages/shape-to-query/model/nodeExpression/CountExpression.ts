import { GraphPointer } from 'clownface'
import { sh } from '@tpluscode/rdf-ns-builders/loose'
import { isBlankNode, isGraphPointer } from 'is-graph-pointer'
import { SELECT } from '@tpluscode/sparql-builder'
import { NodeExpression, Parameters } from './NodeExpression.js'
import { getOne, getOneOrZero } from './util.js'
import { NodeExpressionFactory } from './index.js'

export class CountExpression implements NodeExpression {
  static match(pointer: GraphPointer) {
    return isBlankNode(pointer) && isGraphPointer(getOneOrZero(pointer, sh.count))
  }

  static fromPointer(pointer: GraphPointer, createExpr: NodeExpressionFactory) {
    return new CountExpression(createExpr(getOne(pointer, sh.count)))
  }

  constructor(public expression: NodeExpression) {
  }

  buildPatterns(arg: Parameters) {
    const object = arg.variable()

    return SELECT`(COUNT(${object}) as ${arg.object})`
      .WHERE`${this.expression.buildPatterns({ ...arg, object })}`
  }
}
