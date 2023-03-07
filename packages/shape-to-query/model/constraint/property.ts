import { GraphPointer } from 'clownface'
import { sh } from '@tpluscode/rdf-ns-builders'
import { PropertyShape } from '../PropertyShape'
import { propertyShape } from '../fromNode'
import { ConstraintComponent, Parameters } from './ConstraintComponent'

export class PropertyConstraintComponent extends ConstraintComponent {
  constructor(public readonly shape: PropertyShape) {
    super(sh.PropertyConstraintComponent)
  }

  static fromPointer(pointer: GraphPointer) {
    return new PropertyConstraintComponent(propertyShape(pointer))
  }

  buildPatterns(arg: Parameters) {
    return this.shape.buildConstraints(arg)
  }
}
