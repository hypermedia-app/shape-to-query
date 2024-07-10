import type { Term } from '@rdfjs/types'
import type { GraphPointer } from 'clownface'
import { isGraphPointer, isLiteral } from 'is-graph-pointer'
import { xsd } from '@tpluscode/rdf-ns-builders'
import { sh } from '@tpluscode/rdf-ns-builders/loose'
import { fromRdf } from 'rdf-literal'
import type sparqljs from 'sparqljs'
import type { ModelFactory } from '../ModelFactory.js'
import { getOne } from './util.js'
import type { NodeExpression } from './NodeExpression.js'
import { SubselectExpression } from './SubselectExpression.js'

export class OffsetExpression extends SubselectExpression {
  static match(pointer: GraphPointer) {
    return isLiteral(pointer.out(sh.offset), xsd.integer) && isGraphPointer(pointer.out(sh.nodes))
  }

  static fromPointer(pointer: GraphPointer, fromNode: ModelFactory) {
    const offset = pointer.out(sh.offset)
    if (!isLiteral(offset) || !offset.term.datatype.equals(xsd.integer)) {
      throw new Error('sh:offset must be an xsd:integer')
    }

    return new OffsetExpression(pointer.term, fromRdf(offset.term, true), fromNode.nodeExpression(getOne(pointer, sh.nodes)))
  }

  constructor(term: Term, private readonly offset: number, nodes: NodeExpression) {
    super(term, nodes)
  }

  protected _applySubselectClause(select: sparqljs.SelectQuery): sparqljs.SelectQuery {
    return {
      ...select,
      offset: this.offset,
    }
  }
}
