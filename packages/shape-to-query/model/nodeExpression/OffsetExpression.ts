import { Term } from 'rdf-js'
import { Select } from '@tpluscode/sparql-builder'
import type { GraphPointer } from 'clownface'
import { isGraphPointer, isLiteral } from 'is-graph-pointer'
import { xsd } from '@tpluscode/rdf-ns-builders'
import { sh } from '@tpluscode/rdf-ns-builders/loose'
import { fromRdf } from 'rdf-literal'
import { ModelFactory } from '../ModelFactory.js'
import { getOne } from './util.js'
import { NodeExpression } from './NodeExpression.js'
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

  protected _applySubselectClause(select: Select): Select {
    return select.OFFSET(this.offset)
  }
}
