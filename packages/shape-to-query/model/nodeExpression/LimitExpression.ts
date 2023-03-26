import { SELECT, Select } from '@tpluscode/sparql-builder'
import { GraphPointer } from 'clownface'
import { isGraphPointer, isLiteral } from 'is-graph-pointer'
import { sh } from '@tpluscode/rdf-ns-builders/loose'
import { xsd } from '@tpluscode/rdf-ns-builders'
import { fromRdf } from 'rdf-literal'
import { getOne } from './util.js'
import { NodeExpression, Parameters } from './NodeExpression.js'
import { NodeExpressionFactory } from './index.js'

export class LimitExpression implements NodeExpression {
  static match(pointer: GraphPointer) {
    return isLiteral(pointer.out(sh.limit), xsd.integer) && isGraphPointer(pointer.out(sh.nodes))
  }

  static fromPointer(pointer: GraphPointer, fromNode: NodeExpressionFactory) {
    const limit = pointer.out(sh.limit)
    if (!isLiteral(limit) || !limit.term.datatype.equals(xsd.integer)) {
      throw new Error('sh:limit must be an xsd:integer')
    }

    return new LimitExpression(fromRdf(limit.term), fromNode(getOne(pointer, sh.nodes)))
  }

  constructor(private readonly limit: number, private readonly nodes: NodeExpression) {
  }

  buildPatterns(arg: Parameters): Select {
    const selectOrPatterns = this.nodes.buildPatterns(arg)
    let select: Select

    if ('build' in selectOrPatterns) {
      select = selectOrPatterns
    } else {
      select = SELECT`${arg.subject} ${arg.object}`.WHERE`${selectOrPatterns}`
    }

    return select.LIMIT(this.limit)
  }
}
