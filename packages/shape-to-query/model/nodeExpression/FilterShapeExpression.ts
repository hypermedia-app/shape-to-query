import { GraphPointer } from 'clownface'
import { isGraphPointer } from 'is-graph-pointer'
import { sh } from '@tpluscode/rdf-ns-builders'
import { sparql, SparqlTemplateResult } from '@tpluscode/sparql-builder'
import { fromNode as shape } from '../fromNode.js'
import { NodeShape } from '../NodeShape.js'
import { getOne, getOneOrZero } from './util.js'
import { FocusNodeExpression } from './FocusNodeExpression.js'
import { NodeExpression, NodeExpressionFactory, Parameters } from './index.js'

export class FilterShapeExpression implements NodeExpression {
  constructor(public readonly shape: NodeShape, public readonly nodes: NodeExpression = new FocusNodeExpression()) {

  }

  static match(pointer: GraphPointer) {
    return isGraphPointer(pointer.out(sh.filterShape))
  }

  static fromPointer(pointer: GraphPointer, fromNode: NodeExpressionFactory, createShape = fromNode) {
    const filterShape = shape(getOne(pointer, sh.filterShape))
    const nodes = getOneOrZero(pointer, sh.nodes)

    if (nodes) {
      return new FilterShapeExpression(filterShape, createShape(nodes))
    }

    return new FilterShapeExpression(filterShape)
  }

  buildPatterns({ subject, object, variable }: Parameters): SparqlTemplateResult {
    const focusNode = object
    const valueNode = variable()

    return sparql`
      ${this.nodes.buildPatterns({ subject, object, variable })}
      ${this.shape.buildConstraints({ focusNode, valueNode, variable })}`
  }
}
