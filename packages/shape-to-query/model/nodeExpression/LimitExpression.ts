import { Term } from 'rdf-js'
import { Select } from '@tpluscode/sparql-builder'
import type { GraphPointer } from 'clownface'
import { isGraphPointer, isLiteral } from 'is-graph-pointer'
import { sh } from '@tpluscode/rdf-ns-builders/loose'
import { xsd } from '@tpluscode/rdf-ns-builders'
import { fromRdf } from 'rdf-literal'
import { ModelFactory } from '../ModelFactory.js'
import { getOne } from './util.js'
import { NodeExpression } from './NodeExpression.js'
import { SubselectExpression } from './SubselectExpression.js'

export class LimitExpression extends SubselectExpression {
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

  constructor(term: Term, private readonly limit: number, nodes: NodeExpression) {
    super(term, nodes)
  }

  protected _applySubselectClause(select: Select): Select {
    return select.LIMIT(this.limit)
  }
}
