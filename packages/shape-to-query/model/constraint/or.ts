import { GraphPointer } from 'clownface'
import { SparqlTemplateResult, sparql } from '@tpluscode/sparql-builder'
import { UNION } from '@tpluscode/sparql-builder/expressions'
import { NodeShape } from '../NodeShape'
import { fromNode } from '../fromNode'
import { ConstraintComponent, Parameters } from './ConstraintComponent'

export class OrConstraintComponent implements ConstraintComponent {
  constructor(public readonly inner: ReadonlyArray<NodeShape>) {
  }

  static fromPointer(parameter: GraphPointer) {
    const list = parameter.list()
    if (!list) {
      throw new Error('sh:or must be a list')
    }
    const inner = [...list].map(fromNode)
    return new OrConstraintComponent(inner)
  }

  buildPatterns(arg: Parameters): SparqlTemplateResult {
    const propExpr = arg.propertyPath ? sparql`${arg.focusNode} ${arg.propertyPath} ${arg.valueNode} .` : ''

    return sparql`${UNION(...this.inner.map(inner => sparql`
      ${propExpr}
      ${inner.buildConstraints(arg)}
    `))}`
  }
}
