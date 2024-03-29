import { Term } from 'rdf-js'
import type { GraphPointer } from 'clownface'
import { isGraphPointer } from 'is-graph-pointer'
import { sh } from '@tpluscode/rdf-ns-builders/loose'
import { SELECT, Select } from '@tpluscode/sparql-builder'
import { TRUE } from '../../lib/rdf.js'
import { ModelFactory } from '../ModelFactory.js'
import { getOne } from './util.js'
import NodeExpressionBase, { NodeExpression, Parameters, PatternBuilder } from './NodeExpression.js'

export class OrderByExpression extends NodeExpressionBase {
  static match(pointer: GraphPointer) {
    return isGraphPointer(pointer.out(sh.orderBy)) && isGraphPointer(pointer.out(sh.nodes))
  }

  static fromPointer(pointer: GraphPointer, fromNode: ModelFactory) {
    const orderBy = getOne(pointer, sh.orderBy)
    const nodes = getOne(pointer, sh.nodes)
    const descending = TRUE.equals(pointer.out(sh.desc).term)

    return new OrderByExpression(pointer.term, fromNode.nodeExpression(orderBy), fromNode.nodeExpression(nodes), descending)
  }

  public get requiresFullContext(): boolean {
    return this.nodes.requiresFullContext || this.orderExpression.requiresFullContext
  }

  constructor(
    public readonly term: Term,
    public readonly orderExpression: NodeExpression,
    public readonly nodes: NodeExpression,
    public readonly descending = false) {
    super()
  }

  _buildPatterns({ subject, object, rootPatterns, variable }: Parameters, builder: PatternBuilder): Select {
    const selectOrPatterns = builder.build(this.nodes, { subject, object, variable, rootPatterns })
    const { patterns: orderPatterns, object: orderVariable } = builder.build(this.orderExpression, {
      subject: selectOrPatterns.object,
      variable,
      rootPatterns,
    })
    let select: Select

    if ('build' in selectOrPatterns.patterns) {
      select = selectOrPatterns.patterns
    } else {
      select = SELECT`${subject} ${selectOrPatterns.object}`.WHERE`${selectOrPatterns.patterns}`
    }

    return select.WHERE`OPTIONAL { ${orderPatterns} }`.ORDER().BY(orderVariable, this.descending)
  }
}
