import type { Term } from '@rdfjs/types'
import { SELECT, Select } from '@tpluscode/sparql-builder'
import NodeExpressionBase, { NodeExpression, Parameters, PatternBuilder } from './NodeExpression.js'

export abstract class SubselectExpression extends NodeExpressionBase {
  public get requiresFullContext(): boolean {
    return this.nodes.requiresFullContext
  }

  protected constructor(public readonly term: Term, private readonly nodes: NodeExpression) {
    super()
  }

  _buildPatterns(arg: Parameters, builder: PatternBuilder) {
    const selectOrPatterns = builder.build(this.nodes, arg)
    let select: Select

    if ('build' in selectOrPatterns.patterns) {
      select = selectOrPatterns.patterns
    } else {
      select = SELECT`${arg.subject} ${selectOrPatterns.object}`.WHERE`${selectOrPatterns.patterns}`
    }

    return this._applySubselectClause(select)
  }

  protected abstract _applySubselectClause(select: Select): Select
}
