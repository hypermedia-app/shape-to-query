import { Term } from 'rdf-js'
import { GraphPointer } from 'clownface'
import { isGraphPointer } from 'is-graph-pointer'
import { sh } from '@tpluscode/rdf-ns-builders'
import { sparql } from '@tpluscode/sparql-builder'
import { ModelFactory } from '../ModelFactory.js'
import { NodeShape } from '../NodeShape.js'
import { getOne, getOneOrZero } from './util.js'
import { FocusNodeExpression } from './FocusNodeExpression.js'
import { NodeExpression, Parameters } from './NodeExpression.js'

export class FilterShapeExpression implements NodeExpression {
  constructor(public readonly term: Term, public readonly shape: NodeShape, public readonly nodes: NodeExpression = new FocusNodeExpression()) {

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

  buildPatterns({ subject, variable, rootPatterns, builder }: Parameters) {
    const { patterns, object } = builder.build(this.nodes, { subject, variable, rootPatterns, builder })
    const focusNode = object
    const valueNode = variable()

    return {
      object,
      patterns: sparql`
        ${patterns}
        ${this.shape.buildConstraints({ focusNode, valueNode, variable, rootPatterns })}`,
    }
  }
}
