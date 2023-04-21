import { Term } from 'rdf-js'
import { GraphPointer } from 'clownface'
import { isGraphPointer } from 'is-graph-pointer'
import { sh } from '@tpluscode/rdf-ns-builders/loose'
import { SELECT, Select } from '@tpluscode/sparql-builder'
import { TRUE } from '../../lib/rdf.js'
import { ModelFactory } from '../ModelFactory.js'
import { getOne } from './util.js'
import { NodeExpression, NodeExpressionResult, Parameters } from './NodeExpression.js'

export class OrderByExpression implements NodeExpression {
  static match(pointer: GraphPointer) {
    return isGraphPointer(pointer.out(sh.orderBy)) && isGraphPointer(pointer.out(sh.nodes))
  }

  static fromPointer(pointer: GraphPointer, fromNode: ModelFactory) {
    const orderBy = getOne(pointer, sh.orderBy)
    const nodes = getOne(pointer, sh.nodes)
    const descending = TRUE.equals(pointer.out(sh.desc).term)

    return new OrderByExpression(pointer.term, fromNode.nodeExpression(orderBy), fromNode.nodeExpression(nodes), descending)
  }

  constructor(
    public readonly term: Term,
    public readonly orderExpression: NodeExpression,
    public readonly nodes: NodeExpression,
    public readonly descending = false) {
  }

  buildPatterns(arg: Parameters): NodeExpressionResult {
    const object = arg.variable()
    const orderVariable = arg.variable()
    const selectOrPatterns = arg.builder.build(this.nodes, arg)
    const orderPatterns = arg.builder.build(this.orderExpression, {
      ...arg,
      subject: object,
    })
    let select: Select

    if ('build' in selectOrPatterns.patterns) {
      select = selectOrPatterns.patterns
    } else {
      select = SELECT`${arg.subject} ${selectOrPatterns.object}`.WHERE`${selectOrPatterns.patterns}`
    }

    return {
      object,
      patterns: select.WHERE`OPTIONAL { ${orderPatterns.patterns} }`.ORDER().BY(orderVariable, this.descending),
    }
  }
}
