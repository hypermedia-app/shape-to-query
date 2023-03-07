import { GraphPointer } from 'clownface'
import { sh } from '@tpluscode/rdf-ns-builders'
import { fromNode } from '../fromNode'
import { NodeShape } from '../NodeShape'
import { ConstraintComponent, Parameters } from './ConstraintComponent'

export class NodeConstraintComponent extends ConstraintComponent {
  constructor(public readonly shape: NodeShape) {
    super(sh.NodeConstraintComponent)
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
