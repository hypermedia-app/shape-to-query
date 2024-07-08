import type { BlankNode, Literal, NamedNode } from '@rdfjs/types'
import { sh } from '@tpluscode/rdf-ns-builders'
import type sparqljs from 'sparqljs'
import ConstraintComponent, { Parameters, PropertyShape } from './ConstraintComponent.js'

export class HasValueConstraintComponent extends ConstraintComponent {
  constructor(public readonly terms: ReadonlyArray<NamedNode | BlankNode | Literal>) {
    super(sh.HasValueConstraintComponent)
  }

  static * fromShape(shape: PropertyShape) {
    const values = shape.get(sh.hasValue)

    if (values) {
      const terms = values.flatMap(hv => 'list' in hv ? [] : hv.pointer.term)
      yield new HasValueConstraintComponent(terms)
    }
  }

  buildNodeShapePatterns(): sparqljs.Pattern[] {
    return []
  }

  buildPropertyShapePatterns({ focusNode, propertyPath, valueNode }: Omit<Parameters, 'rootPatterns'>): [sparqljs.ValuesPattern | sparqljs.FilterPattern] {
    if (this.terms.length === 1) {
      return [{
        type: 'values',
        values: this.terms.map(term => ({
          ['?' + valueNode.value]: term,
        })),
      }]
    }

    const triples = this.terms.map(term => ({
      subject: focusNode,
      predicate: propertyPath,
      object: term,
    }))

    return [{
      type: 'filter',
      expression: {
        type: 'operation',
        operator: 'exists',
        args: [{
          type: 'bgp',
          triples,
        }],
      },
    }]
  }
}
