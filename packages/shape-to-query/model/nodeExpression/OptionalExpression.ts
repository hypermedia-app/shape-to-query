import { Term } from 'rdf-js'
import { sparql } from '@tpluscode/sparql-builder'
import { GraphPointer } from 'clownface'
import { isGraphPointer } from 'is-graph-pointer'
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

  constructor(public readonly term: Term, public readonly inner: NodeExpression) {
    super()
  }

  protected _buildPatterns(arg: Required<Parameters>, builder: PatternBuilder) {
    return sparql`OPTIONAL {
      ${builder.build(this.inner, arg).patterns}
    }`
  }
}
