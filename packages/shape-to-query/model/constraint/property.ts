import { GraphPointer } from 'clownface'
import { sh } from '@tpluscode/rdf-ns-builders'
import { PropertyShape } from '../PropertyShape.js'
import { ModelFactory } from '../ModelFactory.js'
import { ConstraintComponent, Parameters } from './ConstraintComponent.js'

export class PropertyConstraintComponent extends ConstraintComponent {
  constructor(public readonly shape: PropertyShape) {
    super(sh.PropertyConstraintComponent)
  }

  static fromPointer(pointer: GraphPointer, factory: ModelFactory) {
    return new PropertyConstraintComponent(factory.propertyShape(pointer))
  }

  buildPatterns(arg: Parameters) {
    return this.shape.buildConstraints(arg)
  }
}
