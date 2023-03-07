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

  static fromPointer(parameter: GraphPointer) {
    const list = parameter.list()
    if (!list) {
      throw new Error('sh:and must be a list')
    }
    const inner = [...list].map(fromNode)
    return new AndConstraintComponent(inner)
  }

  buildPatterns(arg: Parameters): SparqlTemplateResult {
    return sparql`${this.inner.map(inner => inner.buildConstraints(arg))}`
  }
}
