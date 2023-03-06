import { GraphPointer } from 'clownface'
import { SparqlTemplateResult, sparql } from '@tpluscode/sparql-builder'
import { NodeShape } from '../NodeShape'
import { fromNode } from '../fromNode'
import { ConstraintComponent, Parameters } from './ConstraintComponent'

export class AndConstraintComponent implements ConstraintComponent {
  constructor(public readonly inner: ReadonlyArray<NodeShape>) {
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
