import { Term, Variable } from 'rdf-js'
import type { GraphPointer } from 'clownface'
import { isGraphPointer } from 'is-graph-pointer'
import { sh } from '@tpluscode/rdf-ns-builders'
import { sparql } from '@tpluscode/sparql-builder'
import { ModelFactory } from '../ModelFactory.js'
import { NodeShape } from '../NodeShape.js'
import { getOne, getOneOrZero } from './util.js'
import { FocusNodeExpression } from './FocusNodeExpression.js'
import NodeExpressionBase, { NodeExpression, NodeExpressionResult, Parameters, PatternBuilder } from './NodeExpression.js'

export class FilterShapeExpression extends NodeExpressionBase {
  constructor(public readonly term: Term, public readonly shape: NodeShape, public readonly nodes: NodeExpression = new FocusNodeExpression()) {
    super()
  }

  static match(pointer: GraphPointer) {
    return isGraphPointer(pointer.out(sh.filterShape))
  }

  static fromPointer(pointer: GraphPointer, factory: ModelFactory) {
    const filterShape = factory.nodeShape(getOne(pointer, sh.filterShape))
    const nodes = getOneOrZero(pointer, sh.nodes)

    if (nodes) {
      return new FilterShapeExpression(pointer.term, filterShape, factory.nodeExpression(nodes))
    }

    return new FilterShapeExpression(pointer.term, filterShape)
  }

  _buildPatterns({ subject, variable, rootPatterns, object }: Parameters, builder: PatternBuilder) {
    let focusNode = subject
    let patterns : NodeExpressionResult['patterns'] = sparql``
    let valueNode: Variable

    if (this.nodes instanceof FocusNodeExpression) {
      valueNode = object
    } else {
      ({ patterns, object: focusNode } = builder.build(this.nodes, { subject, object, variable, rootPatterns }))
      valueNode = variable()
    }

    return sparql`
      ${patterns}
      ${this.shape.buildConstraints({ focusNode, valueNode, variable, rootPatterns })}`
  }
}
