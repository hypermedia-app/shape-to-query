import { SparqlTemplateResult, sparql } from '@tpluscode/sparql-builder'
import { sh } from '@tpluscode/rdf-ns-builders'
import { NodeShape } from '../NodeShape.js'
import { ModelFactory } from '../ModelFactory.js'
import { assertList, ConstraintComponent, Parameters, PropertyShape } from './ConstraintComponent.js'

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

  buildPatterns(arg: Parameters): SparqlTemplateResult {
    return sparql`${this.inner.map(inner => inner.buildConstraints(arg))}`
  }
}
