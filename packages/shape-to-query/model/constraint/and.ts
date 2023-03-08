import { GraphPointer } from 'clownface'
import { SparqlTemplateResult, sparql } from '@tpluscode/sparql-builder'
import { sh } from '@tpluscode/rdf-ns-builders'
import { NodeShape } from '../NodeShape'
import { fromNode } from '../fromNode'
import { ConstraintComponent, Parameters } from './ConstraintComponent'

export class AndConstraintComponent extends ConstraintComponent {
  constructor(public readonly inner: ReadonlyArray<NodeShape>) {
    super(sh.AndConstraintComponent)
  }

  static fromList(shapes: GraphPointer[]) {
    return new AndConstraintComponent(shapes.map(fromNode))
  }

  buildPatterns(arg: Parameters): SparqlTemplateResult {
    return sparql`${this.inner.map(inner => inner.buildConstraints(arg))}`
  }
}
