import { Term } from 'rdf-js'
import { Select } from '@tpluscode/sparql-builder'
import type { GraphPointer } from 'clownface'
import { isGraphPointer } from 'is-graph-pointer'
import { sh } from '@tpluscode/rdf-ns-builders/loose'
import { ModelFactory } from '../ModelFactory.js'
import { SubselectExpression } from './SubselectExpression.js'
import { NodeExpression } from './NodeExpression.js'

export class DistinctExpression extends SubselectExpression {
  static match(pointer: GraphPointer) {
    return isGraphPointer(pointer.out(sh.distinct))
  }

  static fromPointer(pointer: GraphPointer, factory: ModelFactory) {
    const distinct = factory.nodeExpression(pointer.out(sh.distinct))
    return new DistinctExpression(pointer.term, distinct)
  }

  public get requiresFullContext(): boolean {
    return this.distinct.requiresFullContext
  }

  public constructor(term: Term, private distinct: NodeExpression) {
    super(term, distinct)
  }

  protected _applySubselectClause(select: Select): Select {
    return select.DISTINCT()
  }
}
