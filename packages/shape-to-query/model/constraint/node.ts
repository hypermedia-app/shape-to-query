import { GraphPointer } from 'clownface'
import { fromNode } from '../fromNode'
import { NodeShape } from '../NodeShape'
import { ConstraintComponent, Parameters } from './ConstraintComponent'

export class NodeConstraintComponent implements ConstraintComponent {
  constructor(public readonly shape: NodeShape) {
  }

  static fromPointer(pointer: GraphPointer) {
    return new NodeConstraintComponent(fromNode(pointer))
  }

  buildPatterns({ valueNode, variable, ...arg }: Parameters) {
    return this.shape.buildConstraints({
      ...arg,
      variable,
      focusNode: valueNode,
      valueNode: variable(),
    })
  }
}
