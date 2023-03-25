import { GraphPointer } from 'clownface'
import { isGraphPointer } from 'is-graph-pointer'
import { sh } from '@tpluscode/rdf-ns-builders/loose'
import { SELECT, Select } from '@tpluscode/sparql-builder'
import { TRUE } from '../../lib/rdf'
import { getOne } from './util'
import { NodeExpression, Parameters } from './NodeExpression'
import { NodeExpressionFactory } from './index'

export class OrderByExpression implements NodeExpression {
  static match(pointer: GraphPointer) {
    return isGraphPointer(pointer.out(sh.orderBy)) && isGraphPointer(pointer.out(sh.nodes))
  }

  static fromPointer(pointer: GraphPointer, fromNode: NodeExpressionFactory) {
    const orderBy = getOne(pointer, sh.orderBy)
    const nodes = getOne(pointer, sh.nodes)
    const descending = TRUE.equals(pointer.out(sh.desc).term)

    return new OrderByExpression(fromNode(orderBy), fromNode(nodes), descending)
  }

  constructor(
    public readonly orderExpression: NodeExpression,
    public readonly nodes: NodeExpression,
    public readonly descending = false) {
  }

  buildPatterns(arg: Parameters): Select {
    const orderVariable = arg.variable()
    const selectOrPatterns = this.nodes.buildPatterns(arg)
    const orderPatterns = this.orderExpression.buildPatterns({
      ...arg,
      subject: arg.object,
      object: orderVariable,
    })
    let select: Select

    if ('build' in selectOrPatterns) {
      select = selectOrPatterns
    } else {
      select = SELECT`${arg.subject} ${arg.object}`.WHERE`${selectOrPatterns}`
    }

    return select.WHERE`OPTIONAL { ${orderPatterns} }`.ORDER().BY(orderVariable, this.descending)
  }
}