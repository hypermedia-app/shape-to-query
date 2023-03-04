import { GraphPointer } from 'clownface'
import { fromNode } from '../fromNode'
import { ShapePatterns } from '../../lib/shapePatterns'
import { NodeShape } from '../NodeShape'
import { ConstraintComponent, Parameters } from './ConstraintComponent'

export class NodeConstraintComponent implements ConstraintComponent {
  constructor(public readonly shape: NodeShape) {
  }

  static fromPointer(pointer: GraphPointer) {
    return new NodeConstraintComponent(fromNode(pointer))
  }

  buildPatterns(arg: Parameters): ShapePatterns {
    return this.shape.buildPatterns(arg)
  }
}
