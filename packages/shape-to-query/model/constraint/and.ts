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

  static fromList(shapes: GraphPointer[], factory: ModelFactory) {
    return new AndConstraintComponent(shapes.map(p => factory.nodeShape(p)))
  }

  buildPatterns(arg: Parameters): SparqlTemplateResult {
    return sparql`${this.inner.map(inner => inner.buildConstraints(arg))}`
  }
}
