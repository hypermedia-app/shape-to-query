import { xsd } from '@tpluscode/rdf-ns-builders'
import { sh } from '@tpluscode/rdf-ns-builders/loose'
import namespace from '@rdfjs/namespace'
import { isGraphPointer, isLiteral } from 'is-graph-pointer'
import { fromRdf } from 'rdf-literal'
import type { GraphPointer } from 'clownface'
import {
  OffsetExpression,
  OrderByExpression,
  LimitExpression,
  NodeExpression, NodeExpressionFactory,
} from '@hydrofoil/shape-to-query/nodeExpressions.js'
import { getOne, getOneOrZero } from '@hydrofoil/shape-to-query/model/nodeExpression/util.js'

const ex = namespace('http://example.org/')

export class ShorthandSubselectExpression implements NodeExpression {
  static match(pointer) {
    const limit = getOneOrZero(pointer, ex.limit)
    const offset = getOneOrZero(pointer, ex.offset)
    const orderBy = getOneOrZero(pointer, ex.orderBy)
    const nodes = getOneOrZero(pointer, sh.nodes)
    return isGraphPointer(nodes) && (isLiteral(limit, xsd.integer) || isLiteral(offset, xsd.integer) || isGraphPointer(orderBy))
  }

  static fromPointer(pointer: GraphPointer, createExpr: NodeExpressionFactory) {
    let subselect = createExpr(getOne(pointer, sh.nodes))

    subselect = [...getOneOrZero(pointer, ex.orderBy).list()]
      .reduce(toOrderBySequence(createExpr), subselect)
    const offset = getOneOrZero(pointer, ex.offset, isLiteral)
    if (offset) {
      subselect = new OffsetExpression(fromRdf(offset.term), subselect)
    }
    const limit = getOneOrZero(pointer, ex.limit, isLiteral)
    if (limit) {
      subselect = new LimitExpression(fromRdf(limit.term), subselect)
    }

    return new ShorthandSubselectExpression(subselect)
  }

  constructor(public expression: NodeExpression) {
  }

  buildPatterns(arg) {
    return this.expression.buildPatterns(arg)
  }
}

function toOrderBySequence(createExpr: NodeExpressionFactory) {
  return (seq: NodeExpression, current: GraphPointer) => {
    const desc = current.out(sh.desc).value === 'true'
    const orderExpr = createExpr(current.out(sh.orderBy))
    return new OrderByExpression(orderExpr, seq, desc)
  }
}
