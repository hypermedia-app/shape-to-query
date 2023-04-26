import { GraphPointer } from 'clownface'
import { SparqlTemplateResult, sparql } from '@tpluscode/sparql-builder'
import { UNION } from '@tpluscode/sparql-builder/expressions'
import { sh } from '@tpluscode/rdf-ns-builders'
import { NodeShape } from '../NodeShape.js'
import { ModelFactory } from '../ModelFactory.js'
import { ConstraintComponent, Parameters } from './ConstraintComponent.js'

export class OrConstraintComponent extends ConstraintComponent {
  constructor(public readonly inner: ReadonlyArray<NodeShape>) {
    super(sh.OrConstraintComponent)
  }

  static fromList(shapes: GraphPointer[], factory: ModelFactory) {
    return new OrConstraintComponent(shapes.map(p => factory.nodeShape(p)))
  }

  buildPatterns(arg: Parameters): SparqlTemplateResult {
    const propExpr = arg.propertyPath ? sparql`${arg.focusNode} ${arg.propertyPath} ${arg.valueNode} .` : ''

    const inner = this.inner
      .map(i => i.buildConstraints(arg))
      .filter(Boolean)
      .map(innerResult => sparql`
        ${propExpr}
        ${innerResult}
      `)
    return sparql`${UNION(...inner)}`
  }
}
