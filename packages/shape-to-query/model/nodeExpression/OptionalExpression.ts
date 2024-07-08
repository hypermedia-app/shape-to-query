import type { Term } from '@rdfjs/types'
import type { GraphPointer } from 'clownface'
import { isGraphPointer } from 'is-graph-pointer'
import type sparqljs from 'sparqljs'
import { ModelFactory } from '../ModelFactory.js'
import s2q from '../../ns.js'
import NodeExpressionBase, { PatternBuilder, Parameters, NodeExpression } from './NodeExpression.js'

export class OptionalExpression extends NodeExpressionBase {
  static match(pointer: GraphPointer) {
    return isGraphPointer(pointer.out(s2q.optional))
  }

  static fromPointer(pointer: GraphPointer, factory: ModelFactory) {
    const inner = pointer.out(s2q.optional)

    return new OptionalExpression(pointer.term, factory.nodeExpression(inner))
  }

  public get requiresFullContext(): boolean {
    return this.inner.requiresFullContext
  }

  public get rootIsFocusNode() {
    return this.inner.rootIsFocusNode
  }

  constructor(public readonly term: Term, public readonly inner: NodeExpression) {
    super()
  }

  protected _buildPatterns(arg: Required<Parameters>, builder: PatternBuilder): sparqljs.OptionalPattern {
    return {
      type: 'optional',
      patterns: builder.build(this.inner, arg).patterns,
    }
  }
}
