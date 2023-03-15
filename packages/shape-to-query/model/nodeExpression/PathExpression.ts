import { GraphPointer } from 'clownface'
import { isBlankNode, isGraphPointer } from 'is-graph-pointer'
import { sh } from '@tpluscode/rdf-ns-builders'
import { sparql, SparqlTemplateResult } from '@tpluscode/sparql-builder'
import { toSparql } from 'clownface-shacl-path'
import { getOne, getOneOrZero } from './util'
import { NodeExpression, Parameters } from './NodeExpression'
import { NodeExpressionFactory } from './index'

export class PathExpression implements NodeExpression {
  static match(pointer: GraphPointer) {
    return isBlankNode(pointer) && isGraphPointer(pointer.out(sh.path))
  }

  static fromPointer(pointer: GraphPointer, fromNode: NodeExpressionFactory) {
    const path = getOne(pointer, sh.path)
    const nodes = getOneOrZero(pointer, sh.nodes)

    if (nodes) {
      return new PathExpression(toSparql(path), fromNode(nodes))
    }

    return new PathExpression(toSparql(path))
  }

  constructor(public readonly path: SparqlTemplateResult, public readonly nodes?: NodeExpression) {
  }

  buildPatterns({ subject, object, variable, rootPatterns }: Parameters): SparqlTemplateResult {
    if (this.nodes) {
      const joined = variable()
      return sparql`
        ${this.nodes.buildPatterns({ subject, object: joined, variable, rootPatterns })}
        ${joined} ${this.path} ${object} .
      `
    }

    return sparql`${subject} ${this.path} ${object} .`
  }
}
