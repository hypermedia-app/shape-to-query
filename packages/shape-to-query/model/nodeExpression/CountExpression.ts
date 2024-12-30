import type { Term } from '@rdfjs/types'
import type { GraphPointer } from 'clownface'
import { sh } from '@tpluscode/rdf-ns-builders/loose'
import { isBlankNode, isGraphPointer } from 'is-graph-pointer'
import type sparqljs from 'sparqljs'
import type { ModelFactory } from '../ModelFactory.js'
import type { NodeExpression, Parameters, PatternBuilder } from './NodeExpression.js'
import NodeExpressionImpl from './NodeExpression.js'
import { getOne, getOneOrZero } from './util.js'
import { DistinctExpression } from './DistinctExpression.js'

export class CountExpression extends NodeExpressionImpl {
  static match(pointer: GraphPointer) {
    return isBlankNode(pointer) && isGraphPointer(getOneOrZero(pointer, sh.count))
  }

  static fromPointer(pointer: GraphPointer, createExpr: ModelFactory) {
    return new CountExpression(pointer.term, createExpr.nodeExpression(getOne(pointer, sh.count)))
  }

  public get requiresFullContext(): boolean {
    return this.expression.requiresFullContext
  }

  public get rootIsFocusNode() {
    return this.expression.rootIsFocusNode
  }

  constructor(public readonly term: Term, public expression: NodeExpression) {
    super()
  }

  _buildPatterns({ subject, variable, object, rootPatterns }: Parameters, builder: PatternBuilder): sparqljs.SelectQuery {
    let distinct = false
    let where = builder.build(this.expression, {
      subject,
      variable,
      rootPatterns,
    })

    if (this.expression instanceof DistinctExpression) {
      distinct = true
      const query = where.patterns[0] as sparqljs.SelectQuery
      where = {
        ...where,
        patterns: query.where,
      }
    }

    return {
      type: 'query',
      queryType: 'SELECT',
      prefixes: {},
      variables: [{
        variable: object,
        expression: {
          type: 'aggregate',
          aggregation: 'count',
          expression: where.object,
          distinct,
        },
      }],
      where: where.patterns,
    }
  }
}
