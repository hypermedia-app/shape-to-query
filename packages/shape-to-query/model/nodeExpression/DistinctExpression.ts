import type { Term } from '@rdfjs/types'
import type { GraphPointer } from 'clownface'
import { isGraphPointer } from 'is-graph-pointer'
import { sh } from '@tpluscode/rdf-ns-builders/loose'
import type sparqljs from 'sparqljs'
import type { ModelFactory } from '../ModelFactory.js'
import { SubselectExpression } from './SubselectExpression.js'
import type { NodeExpression } from './NodeExpression.js'

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

  public get rootIsFocusNode() {
    return this.distinct.rootIsFocusNode
  }

  public constructor(term: Term, private distinct: NodeExpression) {
    super(term, distinct)
  }

  protected _applySubselectClause(select: sparqljs.SelectQuery): sparqljs.SelectQuery {
    return {
      ...select,
      distinct: true,
    }
  }
}
