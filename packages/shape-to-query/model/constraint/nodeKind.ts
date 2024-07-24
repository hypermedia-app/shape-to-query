import type { NamedNode, Variable } from '@rdfjs/types'
import { sh } from '@tpluscode/rdf-ns-builders'
import type sparqljs from 'sparqljs'
import type { Parameters, PropertyShape } from './ConstraintComponent.js'
import ConstraintComponent from './ConstraintComponent.js'

export type NodeKind = typeof sh.IRI
  | typeof sh.IRIOrLiteral
  | typeof sh.BlankNodeOrIRI
  | typeof sh.Literal
  | typeof sh.BlankNodeOrLiteral
  | typeof sh.BlankNode

interface CreateFilterExpression {
  (valueNode: Variable | NamedNode): sparqljs.Expression
}

export class NodeKindConstraintComponent extends ConstraintComponent {
  constructor(private readonly __createFilterExpression: CreateFilterExpression) {
    super(sh.NodeKindConstraintComponent)
  }

  static * fromShape(shape: PropertyShape) {
    const values = shape.get(sh.nodeKind)

    if (values) {
      for (const value of values) {
        if (!('pointer' in value)) {
          continue
        }

        const nodeKind = value.pointer.term as NodeKind
        let createFilterExpression: CreateFilterExpression | undefined
        switch (nodeKind.value) {
          case 'http://www.w3.org/ns/shacl#IRI':
            createFilterExpression = is.bind(null, 'iri')
            break
          case 'http://www.w3.org/ns/shacl#IRIOrLiteral':
            createFilterExpression = alternative.bind(null, ['iri', 'literal'])
            break
          case 'http://www.w3.org/ns/shacl#BlankNodeOrIRI':
            createFilterExpression = alternative.bind(null, ['blank', 'iri'])
            break
          case 'http://www.w3.org/ns/shacl#Literal':
            createFilterExpression = is.bind(null, 'literal')
            break
          case 'http://www.w3.org/ns/shacl#BlankNodeOrLiteral':
            createFilterExpression = alternative.bind(null, ['blank', 'literal'])
            break
          case 'http://www.w3.org/ns/shacl#BlankNode':
            createFilterExpression = is.bind(null, 'blank')
            break
        }

        if (createFilterExpression) {
          yield new NodeKindConstraintComponent(createFilterExpression)
        }
      }
    }
  }

  buildNodeShapePatterns({ focusNode }: Parameters): [sparqljs.Pattern] {
    return [this.__buildFilter(focusNode)]
  }

  buildPropertyShapePatterns({ valueNode }: Parameters): [sparqljs.Pattern] {
    return [this.__buildFilter(valueNode)]
  }

  private __buildFilter(subject: NamedNode | Variable): sparqljs.FilterPattern {
    return {
      type: 'filter',
      expression: this.__createFilterExpression(subject),
    }
  }
}

type Kind = 'iri' | 'literal' | 'blank'

function is(what: Kind, value: NamedNode | Variable): sparqljs.Expression {
  return {
    type: 'operation',
    operator: `is${what}`,
    args: [value],
  }
}

function alternative([left, right]: [Kind, Kind], value: NamedNode | Variable): sparqljs.Expression {
  return {
    type: 'operation',
    operator: '||',
    args: [
      is(left, value),
      is(right, value),
    ],
  }
}
