import { sh } from '@tpluscode/rdf-ns-builders'
import type sparqljs from 'sparqljs'
import type { PropertyShape } from '../PropertyShape.js'
import type { ModelFactory } from '../ModelFactory.js'
import type { Parameters, PropertyShape as PS } from './ConstraintComponent.js'
import ConstraintComponent, { assertTerm } from './ConstraintComponent.js'

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

  buildPatterns(arg: Parameters): sparqljs.Pattern[] {
    return this.shape.buildConstraints(arg)
  }
}
