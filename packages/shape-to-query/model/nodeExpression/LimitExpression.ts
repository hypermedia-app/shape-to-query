import { Term } from 'rdf-js'
import { SELECT, Select } from '@tpluscode/sparql-builder'
import { GraphPointer } from 'clownface'
import { isGraphPointer, isLiteral } from 'is-graph-pointer'
import { sh } from '@tpluscode/rdf-ns-builders/loose'
import { xsd } from '@tpluscode/rdf-ns-builders'
import { fromRdf } from 'rdf-literal'
import { ModelFactory } from '../ModelFactory.js'
import { getOne } from './util.js'
import NodeExpressionBase, { NodeExpression, Parameters, PatternBuilder } from './NodeExpression.js'

export class LimitExpression extends NodeExpressionBase {
  static match(pointer: GraphPointer) {
    return isLiteral(pointer.out(sh.limit), xsd.integer) && isGraphPointer(pointer.out(sh.nodes))
  }

  static fromPointer(pointer: GraphPointer, fromNode: ModelFactory) {
    const limit = pointer.out(sh.limit)
    if (!isLiteral(limit) || !limit.term.datatype.equals(xsd.integer)) {
      throw new Error('sh:limit must be an xsd:integer')
    }

    return new LimitExpression(pointer.term, fromRdf(limit.term), fromNode.nodeExpression(getOne(pointer, sh.nodes)))
  }

  constructor(public readonly term: Term, private readonly limit: number, private readonly nodes: NodeExpression) {
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

    return select.LIMIT(this.limit)
  }
}
