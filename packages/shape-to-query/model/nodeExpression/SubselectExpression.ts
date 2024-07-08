import type { Term } from '@rdfjs/types'
import type sparqljs from 'sparqljs'
import NodeExpressionBase, { NodeExpression, NodeExpressionResult, Parameters, PatternBuilder } from './NodeExpression.js'

export abstract class SubselectExpression extends NodeExpressionBase {
  public get requiresFullContext(): boolean {
    return this.nodes.requiresFullContext
  }

  public get rootIsFocusNode() {
    return this.nodes.rootIsFocusNode
  }

  protected constructor(public readonly term: Term, private readonly nodes: NodeExpression) {
    super()
  }

  _buildPatterns(arg: Parameters, builder: PatternBuilder): sparqljs.SelectQuery {
    const selectOrPatterns = builder.build(this.nodes, arg)

    if (selectOrPatterns.patterns[0].type === 'query') {
      return this._applySubselectClause(selectOrPatterns.patterns[0], selectOrPatterns, arg, builder)
    }

    const { subject: focusNode } = arg
    if (focusNode.termType !== 'Variable') {
      throw new Error('Focus node must be a variable in subselect')
    }

    const select: sparqljs.SelectQuery = {
      type: 'query',
      queryType: 'SELECT',
      prefixes: {},
      variables: this.rootIsFocusNode ? [focusNode] : [focusNode, selectOrPatterns.object],
      where: selectOrPatterns.patterns,
    }

    return this._applySubselectClause(select, selectOrPatterns, arg, builder)
  }

  protected abstract _applySubselectClause(select: sparqljs.SelectQuery, queryPatterns: NodeExpressionResult, arg: Parameters, builder: PatternBuilder): sparqljs.SelectQuery
}
