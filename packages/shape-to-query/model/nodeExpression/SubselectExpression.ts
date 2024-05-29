import type { Term } from '@rdfjs/types'
import { SELECT, Select } from '@tpluscode/sparql-builder'
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

  _buildPatterns(arg: Parameters, builder: PatternBuilder) {
    const selectOrPatterns = builder.build(this.nodes, arg)

    if ('build' in selectOrPatterns.patterns) {
      return this._applySubselectClause(selectOrPatterns.patterns, selectOrPatterns, arg, builder)
    }

    const { subject: focusNode } = arg

    let select: Select
    if (this.rootIsFocusNode) {
      select = SELECT`${focusNode}`
    } else {
      select = SELECT`${focusNode} ${selectOrPatterns.object}`
    }

    return this._applySubselectClause(select.WHERE`${selectOrPatterns.patterns}`, selectOrPatterns, arg, builder)
  }

  protected abstract _applySubselectClause(select: Select, queryPatterns: NodeExpressionResult, arg: Parameters, builder: PatternBuilder): Select
}
