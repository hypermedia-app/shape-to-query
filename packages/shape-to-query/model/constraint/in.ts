import { Term } from 'rdf-js'
import { GraphPointer } from 'clownface'
import { SparqlTemplateResult, sparql } from '@tpluscode/sparql-builder'
import { IN } from '@tpluscode/sparql-builder/expressions'
import { ConstraintComponent, Parameters } from './ConstraintComponent'

export class InConstraintComponent implements ConstraintComponent {
  static fromPointer(pointer: GraphPointer) {
    return new InConstraintComponent([...pointer.list()!].map(({ term }) => term))
  }

  constructor(public values: Term[]) {
  }

  buildPatterns({ valueNode }: Parameters): SparqlTemplateResult {
    return sparql`FILTER (${valueNode} ${IN(...this.values)})`
  }
}
