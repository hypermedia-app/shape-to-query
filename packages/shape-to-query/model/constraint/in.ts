import type { Term } from '@rdfjs/types'
import { SparqlTemplateResult, sparql } from '@tpluscode/sparql-builder'
import { IN } from '@tpluscode/sparql-builder/expressions'
import { sh } from '@tpluscode/rdf-ns-builders'
import ConstraintComponent, { assertList, Parameters, PropertyShape } from './ConstraintComponent.js'

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

  buildNodeShapePatterns(): string | SparqlTemplateResult | SparqlTemplateResult[] {
    return ''
  }

  buildPropertyShapePatterns({ valueNode }: Parameters): string | SparqlTemplateResult {
    return sparql`FILTER (${valueNode} ${IN(...this.values)})`
  }
}
