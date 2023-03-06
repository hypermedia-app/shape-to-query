import { Term } from 'rdf-js'
import { SparqlTemplateResult, sparql } from '@tpluscode/sparql-builder'
import { MultiPointer } from 'clownface'
import { ConstraintComponent, Parameters } from './ConstraintComponent'

export class HasValueConstraintComponent implements ConstraintComponent {
  constructor(public readonly terms: ReadonlyArray<Term>) {
  }

  static fromPointers(pointer: MultiPointer) {
    return new HasValueConstraintComponent(pointer.terms)
  }

  buildPatterns({ focusNode, propertyPath }: Parameters): SparqlTemplateResult {
    return sparql`FILTER EXISTS {
      ${focusNode} ${propertyPath} ${objectList(this.terms)}
    }`
  }
}

function objectList([first, ...rest]: Iterable<Term>) {
  return rest.reduce((list, term) => sparql`${list} , ${term}`, sparql`${first}`)
}
