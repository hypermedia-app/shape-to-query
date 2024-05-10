import type { Term } from '@rdfjs/types'
import { xsd } from '@tpluscode/rdf-ns-builders'
import { sh } from '@tpluscode/rdf-ns-builders/loose'
import rdf from '@zazuko/env/web.js'
import { isGraphPointer, isLiteral } from 'is-graph-pointer'
import { fromRdf } from 'rdf-literal'
import type { GraphPointer } from 'clownface'
import {
  OffsetExpression,
  OrderByExpression,
  LimitExpression,
  NodeExpression,
  NodeExpressionFactory,
  PatternBuilder,
  Parameters,
} from '@hydrofoil/shape-to-query/nodeExpressions.js'
import { getOne, getOneOrZero } from '@hydrofoil/shape-to-query/model/nodeExpression/util.js'
import { ModelFactory } from '@hydrofoil/shape-to-query/model/ModelFactory.js'

const ex = rdf.namespace('http://example.org/')

export class ShorthandSubselectExpression implements NodeExpression {
  static match(pointer) {
    const limit = getOneOrZero(pointer, ex.limit)
    const offset = getOneOrZero(pointer, ex.offset)
    const orderBy = getOneOrZero(pointer, ex.orderBy)
    const nodes = getOneOrZero(pointer, sh.nodes)
    return isGraphPointer(nodes) && (isLiteral(limit, xsd.integer) || isLiteral(offset, xsd.integer) || isGraphPointer(orderBy))
  }

  static fromPointer(pointer: GraphPointer, factory: ModelFactory) {
    let subselect = factory.nodeExpression(getOne(pointer, sh.nodes))

    subselect = [...getOneOrZero(pointer, ex.orderBy).list()]
      .reduce(toOrderBySequence(pointer, factory.nodeExpression), subselect)
    const offset = getOneOrZero(pointer, ex.offset, isLiteral)
    if (offset) {
      subselect = new OffsetExpression(pointer.blankNode().term, fromRdf(offset.term), subselect)
    }
    const limit = getOneOrZero(pointer, ex.limit, isLiteral)
    if (limit) {
      subselect = new LimitExpression(pointer.blankNode().term, fromRdf(limit.term), subselect)
    }

    return new ShorthandSubselectExpression(pointer.blankNode().term, subselect)
  }

  get requiresFullContext(): boolean {
    return this.expression.requiresFullContext
  }

  constructor(public readonly term: Term, public expression: NodeExpression) {
  }

  build(arg: Parameters, builder: PatternBuilder) {
    return this.expression.build(arg, builder)
  }
}

function toOrderBySequence(pointer: GraphPointer, createExpr: NodeExpressionFactory) {
  return (seq: NodeExpression, current: GraphPointer) => {
    const desc = current.out(sh.desc).value === 'true'
    const orderExpr = createExpr(current.out(sh.orderBy))
    return new OrderByExpression(pointer.blankNode().term, orderExpr, seq, desc)
  }
}
