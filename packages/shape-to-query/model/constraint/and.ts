import { sh } from '@tpluscode/rdf-ns-builders'
import type sparqljs from 'sparqljs'
import type { NodeShape } from '../NodeShape.js'
import type { ModelFactory } from '../ModelFactory.js'
import type { Parameters, PropertyShape } from './ConstraintComponent.js'
import ConstraintComponent, { assertList } from './ConstraintComponent.js'

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

  buildPatterns(arg: Parameters): sparqljs.Pattern[] {
    return this.inner.flatMap(inner => inner.buildConstraints(arg))
  }
}
