import { sparql, SparqlTemplateResult } from '@tpluscode/sparql-builder'
import { sh } from '@tpluscode/rdf-ns-builders'
import { ConstraintComponent, Parameters, PropertyShape } from './ConstraintComponent.js'

type NodeKind = typeof sh.IRI
  | typeof sh.IRIOrLiteral
  | typeof sh.BlankNodeOrIRI
  | typeof sh.Literal
  | typeof sh.BlankNodeOrLiteral
  | typeof sh.BlankNode

export class NodeKindConstraintComponent extends ConstraintComponent {
  constructor(public readonly nodeKind: NodeKind) {
    super(sh.NodeKindConstraintComponent)
  }

  static * fromShape(shape: PropertyShape) {
    const values = shape.get(sh.nodeKind)

    if (values) {
      for (const value of values) {
        if ('pointer' in value) {
          yield new NodeKindConstraintComponent(<any>value.pointer.term)
        }
      }
    }
  }

  buildPatterns({ valueNode }: Parameters) {
    let nodeKindExpression: SparqlTemplateResult | undefined

    switch (this.nodeKind.value) {
      case 'http://www.w3.org/ns/shacl#BlankNode':
        nodeKindExpression = sparql`IsBlank(${valueNode})`
        break
      case 'http://www.w3.org/ns/shacl#IRI':
        nodeKindExpression = sparql`IsIRI(${valueNode})`
        break
      case 'http://www.w3.org/ns/shacl#IRIOrLiteral':
        nodeKindExpression = sparql`IsIRI(${valueNode}) || IsLiteral(${valueNode})`
        break
      case 'http://www.w3.org/ns/shacl#BlankNodeOrIRI':
        nodeKindExpression = sparql`IsIRI(${valueNode}) || IsBlank(${valueNode})`
        break
      case 'http://www.w3.org/ns/shacl#Literal':
        nodeKindExpression = sparql`IsLiteral(${valueNode})`
        break
      case 'http://www.w3.org/ns/shacl#BlankNodeOrLiteral':
        nodeKindExpression = sparql`IsBlank(${valueNode}) || IsLiteral(${valueNode})`
        break
    }

    if (!nodeKindExpression) {
      return ''
    }

    return sparql`FILTER( ${nodeKindExpression} )`
  }
}
