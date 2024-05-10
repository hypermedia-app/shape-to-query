import type { Term } from '@rdfjs/types'
import { SparqlTemplateResult, sparql } from '@tpluscode/sparql-builder'
import { sh } from '@tpluscode/rdf-ns-builders'
import { VALUES } from '@tpluscode/sparql-builder/expressions'
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

  buildPropertyShapePatterns({ focusNode, propertyPath, valueNode }: Omit<Parameters, 'rootPatterns'>): string | SparqlTemplateResult {
    if (this.terms.length === 1) {
      return VALUES({
        [valueNode.value]: this.terms,
      })
    }

    return sparql`FILTER EXISTS {
      ${focusNode} ${propertyPath} ${objectList(this.terms)}
    }`
  }
}

function objectList([first, ...rest]: Iterable<Term>) {
  return rest.reduce((list, term) => sparql`${list} , ${term}`, sparql`${first}`)
}
