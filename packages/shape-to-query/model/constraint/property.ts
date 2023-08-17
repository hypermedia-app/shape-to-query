import { sh } from '@tpluscode/rdf-ns-builders'
import { PropertyShape } from '../PropertyShape.js'
import { ModelFactory } from '../ModelFactory.js'
import ConstraintComponent, { assertTerm, Parameters, PropertyShape as PS } from './ConstraintComponent.js'

export class PropertyConstraintComponent extends ConstraintComponent {
  constructor(public readonly shape: PropertyShape) {
    super(sh.PropertyConstraintComponent)
  }

  static * fromShape(shape: PS, factory: ModelFactory) {
    const properties = shape.get(sh.property) || []
    for (const property of properties) {
      assertTerm(property)
      yield new PropertyConstraintComponent(factory.propertyShape(property.pointer))
    }
  }

  buildPropertyShapePatterns(arg: Parameters) {
    return this.shape.buildConstraints(arg)
  }
}
