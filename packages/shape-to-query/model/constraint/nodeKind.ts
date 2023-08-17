import { NamedNode, Variable } from 'rdf-js'
import { sparql, SparqlTemplateResult } from '@tpluscode/sparql-builder'
import { sh } from '@tpluscode/rdf-ns-builders'
import ConstraintComponent, { Parameters, PropertyShape } from './ConstraintComponent.js'

export type NodeKind = typeof sh.IRI
  | typeof sh.IRIOrLiteral
  | typeof sh.BlankNodeOrIRI
  | typeof sh.Literal
  | typeof sh.BlankNodeOrLiteral
  | typeof sh.BlankNode

interface CreateFilterExpression {
  (valueNode: Variable | NamedNode): SparqlTemplateResult
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
            createFilterExpression = valueNode => sparql`IsIRI(${valueNode})`
            break
          case 'http://www.w3.org/ns/shacl#IRIOrLiteral':
            createFilterExpression = valueNode => sparql`IsIRI(${valueNode}) || IsLiteral(${valueNode})`
            break
          case 'http://www.w3.org/ns/shacl#BlankNodeOrIRI':
            createFilterExpression = valueNode => sparql`IsBlank(${valueNode}) || IsIRI(${valueNode})`
            break
          case 'http://www.w3.org/ns/shacl#Literal':
            createFilterExpression = valueNode => sparql`IsLiteral(${valueNode})`
            break
          case 'http://www.w3.org/ns/shacl#BlankNodeOrLiteral':
            createFilterExpression = valueNode => sparql`IsBlank(${valueNode}) || IsLiteral(${valueNode})`
            break
          case 'http://www.w3.org/ns/shacl#BlankNode':
            createFilterExpression = valueNode => sparql`IsBlank(${valueNode})`
            break
        }

        if (createFilterExpression) {
          yield new NodeKindConstraintComponent(createFilterExpression)
        }
      }
    }
  }

  buildNodeShapePatterns({ focusNode }: Parameters) {
    return this.__buildFilter(focusNode)
  }

  buildPropertyShapePatterns({ valueNode }: Parameters) {
    return this.__buildFilter(valueNode)
  }

  private __buildFilter(subject: NamedNode | Variable) {
    return sparql`FILTER( ${this.__createFilterExpression(subject)} )`
  }
}
