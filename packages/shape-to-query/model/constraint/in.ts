import { Term } from 'rdf-js'
import { SparqlTemplateResult, sparql } from '@tpluscode/sparql-builder'
import { IN } from '@tpluscode/sparql-builder/expressions'
import { sh } from '@tpluscode/rdf-ns-builders'
import { assertList, ConstraintComponent, Parameters, PropertyShape } from './ConstraintComponent.js'

export class InConstraintComponent extends ConstraintComponent {
  static * fromShape(shape: PropertyShape) {
    const ins = shape.get(sh.in) || []
    for (const inn of ins) {
      assertList(inn)
      yield new InConstraintComponent(inn.list.map(({ term }) => term))
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
