import { Term } from 'rdf-js'
import { SparqlTemplateResult, sparql } from '@tpluscode/sparql-builder'
import { sh } from '@tpluscode/rdf-ns-builders'
import ConstraintComponent, { Parameters, PropertyShape } from './ConstraintComponent.js'

export class HasValueConstraintComponent extends ConstraintComponent {
  constructor(public readonly terms: ReadonlyArray<Term>) {
    super(sh.HasValueConstraintComponent)
  }

  static * fromShape(shape: PropertyShape) {
    const values = shape.get(sh.hasValue)

    if (values) {
      const terms = values.flatMap(hv => 'list' in hv ? [] : hv.pointer.term)
      yield new HasValueConstraintComponent(terms)
    }
  }

  buildNodeShapePatterns(): string | SparqlTemplateResult | SparqlTemplateResult[] {
    return ''
  }

  buildPropertyShapePatterns({ focusNode, propertyPath }: Omit<Parameters, 'rootPatterns'>): string | SparqlTemplateResult {
    return sparql`FILTER EXISTS {
      ${focusNode} ${propertyPath} ${objectList(this.terms)}
    }`
  }
}

function objectList([first, ...rest]: Iterable<Term>) {
  return rest.reduce((list, term) => sparql`${list} , ${term}`, sparql`${first}`)
}
