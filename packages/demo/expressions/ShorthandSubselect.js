import { sh, xsd } from '@tpluscode/rdf-ns-builders'
import namespace from '@rdfjs/namespace'
import { isGraphPointer, isLiteral } from 'is-graph-pointer'
import { fromRdf } from 'rdf-literal'
import E from '@hydrofoil/shape-to-query/nodeExpressions.js'
import U from '@hydrofoil/shape-to-query/model/nodeExpression/util.js'

const ex = namespace('http://example.org/')

export class ShorthandSubselectExpression {
  static match(pointer) {
    const limit = U.getOneOrZero(pointer, ex.limit)
    const offset = U.getOneOrZero(pointer, ex.offset)
    const orderBy = U.getOneOrZero(pointer, ex.orderBy)
    const nodes = U.getOneOrZero(pointer, sh.nodes)
    return isGraphPointer(nodes) && (isLiteral(limit, xsd.integer) || isLiteral(offset, xsd.integer) || isGraphPointer(orderBy))
  }

  static fromPointer(pointer, createExpr) {
    let subselect = createExpr(U.getOne(pointer, sh.nodes))

    subselect = [...U.getOneOrZero(pointer, ex.orderBy).list()]
      .reduce((previousValue, currentValue) => {
        const desc = currentValue.out(sh.desc).value === 'true'
        const orderExpr = createExpr(currentValue.out(sh.orderBy))
        return new E.OrderByExpression(orderExpr, previousValue, desc)
      }, subselect)
    const offset = U.getOneOrZero(pointer, ex.offset)
    if (offset) {
      subselect = new E.OffsetExpression(fromRdf(offset.term), subselect)
    }
    const limit = U.getOneOrZero(pointer, ex.limit)
    if (limit) {
      subselect = new E.LimitExpression(fromRdf(limit.term), subselect)
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
