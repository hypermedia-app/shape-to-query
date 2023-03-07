import { Term } from 'rdf-js'
import { GraphPointer } from 'clownface'
import { SparqlTemplateResult, sparql } from '@tpluscode/sparql-builder'
import { IN } from '@tpluscode/sparql-builder/expressions'
import { sh } from '@tpluscode/rdf-ns-builders'
import { ConstraintComponent, Parameters } from './ConstraintComponent'

export class InConstraintComponent extends ConstraintComponent {
  static fromPointer(pointer: GraphPointer) {
    return new InConstraintComponent([...pointer.list()!].map(({ term }) => term))
  }

  constructor(public values: Term[]) {
    super(sh.InConstraintComponent)
  }

  buildPatterns({ valueNode }: Parameters): SparqlTemplateResult {
    return sparql`FILTER (${valueNode} ${IN(...this.values)})`
  }
}
