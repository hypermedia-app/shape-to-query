import { Term } from 'rdf-js'
import { SparqlTemplateResult, sparql } from '@tpluscode/sparql-builder'
import { MultiPointer } from 'clownface'
import { sh } from '@tpluscode/rdf-ns-builders'
import { ConstraintComponent, Parameters } from './ConstraintComponent'

export class HasValueConstraintComponent extends ConstraintComponent {
  constructor(public readonly terms: ReadonlyArray<Term>) {
    super(sh.HasValueConstraintComponent)
  }

  static fromPointers(pointer: MultiPointer) {
    return new HasValueConstraintComponent(pointer.terms)
  }

  buildPatterns({ focusNode, propertyPath, valueNode }: Parameters): string | SparqlTemplateResult {
    if (!propertyPath) {
      return ''
    }

    if (this.terms.length === 1) {
      return sparql`FILTER( ${valueNode} = ${this.terms[0]} )`
    }

    return sparql`FILTER EXISTS {
      ${focusNode} ${propertyPath} ${objectList(this.terms)}
    }`
  }
}

function objectList([first, ...rest]: Iterable<Term>) {
  return rest.reduce((list, term) => sparql`${list} , ${term}`, sparql`${first}`)
}
