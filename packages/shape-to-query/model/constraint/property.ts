import { GraphPointer } from 'clownface'
import { PropertyShape } from '../PropertyShape'
import { propertyShape } from '../fromNode'
import { ConstraintComponent, Parameters } from './ConstraintComponent'

export class PropertyConstraintComponent implements ConstraintComponent {
  constructor(public readonly shape: PropertyShape) {
  }

  static fromPointer(pointer: GraphPointer) {
    return new PropertyConstraintComponent(propertyShape(pointer))
  }

  buildPatterns(arg: Parameters) {
    return this.shape.buildConstraints(arg)
  }
}
