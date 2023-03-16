import { GraphPointer } from 'clownface'
import { isBlankNode, isGraphPointer } from 'is-graph-pointer'
import { sh } from '@tpluscode/rdf-ns-builders'
import { sparql, SparqlTemplateResult } from '@tpluscode/sparql-builder'
import { toSparql } from 'clownface-shacl-path'
import { NodeExpressionFactory, NodeExpression, Parameters } from './index'

export class PathExpression implements NodeExpression {
  static match(pointer: GraphPointer) {
    return isBlankNode(pointer) && isGraphPointer(pointer.out(sh.path))
  }

  static fromPointer(pointer: GraphPointer, fromNode: NodeExpressionFactory) {
    const path = pointer.out(sh.path)
    const nodes = pointer.out(sh.nodes)
    if (!isGraphPointer(path)) {
      throw new Error('sh:path must have a single object')
    }
    if (nodes.terms.length > 1) {
      throw new Error('sh:nodes must have a single object')
    }

    if (isGraphPointer(nodes)) {
      return new PathExpression(toSparql(path), fromNode(nodes))
    }

    return new PathExpression(toSparql(path))
  }

  constructor(public readonly path: SparqlTemplateResult, public readonly nodes?: NodeExpression) {
  }

  buildPatterns({ subject, object, variable }: Parameters): SparqlTemplateResult {
    if (this.nodes) {
      const joined = variable()
      return sparql`
        ${this.nodes.buildPatterns({ subject, object: joined, variable })}
        ${joined} ${this.path} ${object} .
      `
    }

    return sparql`${subject} ${this.path} ${object} .`
  }
}
