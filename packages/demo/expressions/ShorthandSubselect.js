import { sh, xsd } from '@tpluscode/rdf-ns-builders'
import namespace from '@rdfjs/namespace'
import { isGraphPointer, isLiteral } from 'is-graph-pointer'
import { fromRdf } from 'rdf-literal'
import { OffsetExpression, OrderByExpression, LimitExpression } from '@hydrofoil/shape-to-query/nodeExpressions.js'
import { getOne, getOneOrZero } from '@hydrofoil/shape-to-query/model/nodeExpression/util.js'

const ex = namespace('http://example.org/')

export class ShorthandSubselectExpression {
  static match(pointer) {
    const limit = getOneOrZero(pointer, ex.limit)
    const offset = getOneOrZero(pointer, ex.offset)
    const orderBy = getOneOrZero(pointer, ex.orderBy)
    const nodes = getOneOrZero(pointer, sh.nodes)
    return isGraphPointer(nodes) && (isLiteral(limit, xsd.integer) || isLiteral(offset, xsd.integer) || isGraphPointer(orderBy))
  }

  static fromPointer(pointer, createExpr) {
    let subselect = createExpr(getOne(pointer, sh.nodes))

    subselect = [...getOneOrZero(pointer, ex.orderBy).list()]
      .reduce((previousValue, currentValue) => {
        const desc = currentValue.out(sh.desc).value === 'true'
        const orderExpr = createExpr(currentValue.out(sh.orderBy))
        return new OrderByExpression(orderExpr, previousValue, desc)
      }, subselect)
    const offset = getOneOrZero(pointer, ex.offset)
    if (offset) {
      subselect = new OffsetExpression(fromRdf(offset.term), subselect)
    }
    const limit = getOneOrZero(pointer, ex.limit)
    if (limit) {
      subselect = new LimitExpression(fromRdf(limit.term), subselect)
    }

    return new ShorthandSubselectExpression(subselect)
  }

  constructor(expression) {
    this.expression = expression
  }

  buildPatterns(arg) {
    return this.expression.buildPatterns(arg)
  }
}
