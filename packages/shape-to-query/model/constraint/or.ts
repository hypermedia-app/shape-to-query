import { SparqlTemplateResult, sparql } from '@tpluscode/sparql-builder'
import { UNION } from '@tpluscode/sparql-builder/expressions'
import { sh } from '@tpluscode/rdf-ns-builders'
import { NodeShape } from '../NodeShape.js'
import { ModelFactory } from '../ModelFactory.js'
import ConstraintComponent, { assertList, Parameters, PropertyShape } from './ConstraintComponent.js'

export class OrConstraintComponent extends ConstraintComponent {
  constructor(public readonly inner: ReadonlyArray<NodeShape>) {
    super(sh.OrConstraintComponent)
  }

  static * fromShape(shape: PropertyShape, factory: ModelFactory) {
    const ors = shape.get(sh.or) || []

    for (const or of ors) {
      assertList(or)
      yield new OrConstraintComponent(or.list.map(p => factory.nodeShape(p)))
    }
  }

  buildPropertyShapePatterns(arg: Parameters): SparqlTemplateResult {
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
