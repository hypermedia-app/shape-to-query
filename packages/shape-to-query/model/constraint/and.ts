import { GraphPointer } from 'clownface'
import { SparqlTemplateResult, sparql } from '@tpluscode/sparql-builder'
import { sh } from '@tpluscode/rdf-ns-builders'
import { NodeShape } from '../NodeShape.js'
import { ModelFactory } from '../ModelFactory.js'
import { ConstraintComponent, Parameters } from './ConstraintComponent.js'

export class AndConstraintComponent extends ConstraintComponent {
  constructor(public readonly inner: ReadonlyArray<NodeShape>) {
    super(sh.AndConstraintComponent)
  }

  static * fromShape(shape: GraphPointer, factory: ModelFactory) {
    const ands = shape.out(sh.and).toArray()

    for (const and of ands) {
      if (and.isList()) {
        yield new AndConstraintComponent([...and.list()].map(p => factory.nodeShape(p)))
      }
    }
  }

  buildPatterns(arg: Parameters): SparqlTemplateResult {
    return sparql`${this.inner.map(inner => inner.buildConstraints(arg))}`
  }
}
