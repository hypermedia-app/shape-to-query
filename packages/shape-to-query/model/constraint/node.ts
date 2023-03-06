import { GraphPointer } from 'clownface'
import { SparqlTemplateResult } from '@tpluscode/sparql-builder'
import { fromNode } from '../fromNode'
import { NodeShape } from '../NodeShape'
import { ConstraintComponent, Parameters } from './ConstraintComponent'

export class NodeConstraintComponent implements ConstraintComponent {
  constructor(public readonly shape: NodeShape) {
  }

  static fromPointer(pointer: GraphPointer) {
    return new NodeConstraintComponent(fromNode(pointer))
  }

  buildPatterns({ valueNode, variable, ...arg }: Parameters): SparqlTemplateResult {
    return this.shape.buildConstraints({
      ...arg,
      variable,
      focusNode: valueNode,
      valueNode: variable(),
    })
  }
}
