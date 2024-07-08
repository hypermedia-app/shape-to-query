import type { Term, Variable } from '@rdfjs/types'
import type { GraphPointer } from 'clownface'
import { isGraphPointer } from 'is-graph-pointer'
import { sh } from '@tpluscode/rdf-ns-builders'
import type sparqljs from 'sparqljs'
import { ModelFactory } from '../ModelFactory.js'
import { NodeShape } from '../NodeShape.js'
import { getOne, getOneOrZero } from './util.js'
import { FocusNodeExpression } from './FocusNodeExpression.js'
import NodeExpressionBase, { NodeExpression, Parameters, PatternBuilder } from './NodeExpression.js'

export class FilterShapeExpression extends NodeExpressionBase {
  public get requiresFullContext(): boolean {
    return this.nodes.requiresFullContext
  }

  public get rootIsFocusNode() {
    return this.nodes.rootIsFocusNode
  }

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

  _buildPatterns({ subject, variable, rootPatterns, object }: Parameters, builder: PatternBuilder): sparqljs.Pattern[] {
    let focusNode = subject
    let patterns: sparqljs.Pattern[] = []
    let valueNode: Variable

    if (this.nodes instanceof FocusNodeExpression) {
      valueNode = object
    } else {
      ({ patterns, object: focusNode } = builder.build(this.nodes, { subject, object, variable, rootPatterns }))
      valueNode = variable()
    }

    return [
      ...patterns,
      ...this.shape.buildConstraints({ focusNode, valueNode, variable, rootPatterns }),
    ]
  }
}
