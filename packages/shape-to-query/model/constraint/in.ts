import { Term } from 'rdf-js'
import { GraphPointer } from 'clownface'
import { SparqlTemplateResult, sparql } from '@tpluscode/sparql-builder'
import { IN } from '@tpluscode/sparql-builder/expressions'
import { sh } from '@tpluscode/rdf-ns-builders'
import { ConstraintComponent, Parameters } from './ConstraintComponent.js'

export class InConstraintComponent extends ConstraintComponent {
  static * fromShape(shape: GraphPointer) {
    const list = shape.out(sh.in)
    if (list.isList()) {
      yield new InConstraintComponent([...list.list()].map(({ term }) => term))
    }
  }

  constructor(public values: Term[]) {
    super(sh.InConstraintComponent)
  }

  buildPatterns({ valueNode, propertyPath }: Omit<Parameters, 'rootPatterns'>): string | SparqlTemplateResult {
    if (!propertyPath) {
      return ''
    }

    return sparql`FILTER (${valueNode} ${IN(...this.values)})`
  }
}
