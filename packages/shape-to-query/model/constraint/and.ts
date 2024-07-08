import { sh } from '@tpluscode/rdf-ns-builders'
import type sparqljs from 'sparqljs'
import { NodeShape } from '../NodeShape.js'
import { ModelFactory } from '../ModelFactory.js'
import ConstraintComponent, { assertList, Parameters, PropertyShape } from './ConstraintComponent.js'

export class AndConstraintComponent extends ConstraintComponent {
  constructor(public readonly inner: ReadonlyArray<NodeShape>) {
    super(sh.AndConstraintComponent)
  }

  static * fromShape(shape: PropertyShape, factory: ModelFactory) {
    const ands = shape.get(sh.and) || []

    for (const and of ands) {
      assertList(and)
      yield new AndConstraintComponent(and.list.map(p => factory.nodeShape(p)))
    }
  }

  buildPropertyShapePatterns(arg: Parameters): sparqljs.Pattern[] {
    return this.inner.flatMap(inner => inner.buildConstraints(arg))
  }
}
