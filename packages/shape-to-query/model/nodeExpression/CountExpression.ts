import { GraphPointer } from 'clownface'
import { sh } from '@tpluscode/rdf-ns-builders/loose'
import { isGraphPointer } from 'is-graph-pointer'
import { SELECT } from '@tpluscode/sparql-builder'
import { NodeExpression, Parameters } from './NodeExpression'
import { getOne, getOneOrZero } from './util'
import { NodeExpressionFactory } from './index'

export class CountExpression implements NodeExpression {
  static match(pointer: GraphPointer) {
    return isGraphPointer(getOneOrZero(pointer, sh.count))
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
