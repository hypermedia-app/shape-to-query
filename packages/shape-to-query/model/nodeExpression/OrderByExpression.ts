import type { Term } from '@rdfjs/types'
import type { GraphPointer } from 'clownface'
import { isGraphPointer } from 'is-graph-pointer'
import { sh } from '@tpluscode/rdf-ns-builders/loose'
import type sparqljs from 'sparqljs'
import { TRUE } from '../../lib/rdf.js'
import type { ModelFactory } from '../ModelFactory.js'
import { getOne } from './util.js'
import type { NodeExpression, NodeExpressionResult, Parameters, PatternBuilder } from './NodeExpression.js'
import { SubselectExpression } from './SubselectExpression.js'

export class OrderByExpression extends SubselectExpression {
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
    return super.requiresFullContext || this.orderExpression.requiresFullContext
  }

  constructor(
    term: Term,
    public readonly orderExpression: NodeExpression,
    nodes: NodeExpression,
    public readonly descending = false) {
    super(term, nodes)
  }

  protected _applySubselectClause(select: sparqljs.SelectQuery, queryPatterns: NodeExpressionResult, arg: Parameters, builder: PatternBuilder): sparqljs.SelectQuery {
    const { rootPatterns, variable } = arg

    const { patterns: orderPatterns, object: orderVariable } = builder.build(this.orderExpression, {
      subject: this.rootIsFocusNode ? arg.subject : queryPatterns.object,
      variable,
      rootPatterns,
    })

    const selectWhere = select.where || []
    const selectOrder = select.order || []
    return {
      ...select,
      where: [
        ...selectWhere,
        {
          type: 'optional',
          patterns: orderPatterns,
        },
      ],
      order: [
        ...selectOrder,
        {
          expression: orderVariable,
          descending: this.descending,
        },
      ],
    }
  }
}
