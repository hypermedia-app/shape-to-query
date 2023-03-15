import { GraphPointer } from 'clownface'
import { isGraphPointer } from 'is-graph-pointer'
import { sh } from '@tpluscode/rdf-ns-builders'
import { sparql, SparqlTemplateResult } from '@tpluscode/sparql-builder'
import { fromNode as shape } from '../fromNode'
import { NodeShape } from '../NodeShape'
import { getOne, getOneOrZero } from './util'
import { NodeExpression, Parameters } from './NodeExpression'
import { NodeExpressionFactory } from './index'

export class FilterShapeExpression implements NodeExpression {
  constructor(public readonly shape: NodeShape, public readonly nodes?: NodeExpression) {

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

  buildPatterns({ subject, object, variable, rootPatterns }: Parameters): SparqlTemplateResult {
    if (!this.nodes) {
      return sparql`${this.shape.buildConstraints({ focusNode: subject, valueNode: object, variable, rootPatterns })}`
    }

    return sparql`
      ${this.nodes.buildPatterns({ subject, object, variable, rootPatterns })}
      ${this.shape.buildConstraints({ focusNode: object, valueNode: variable(), variable, rootPatterns })}`
  }
}
