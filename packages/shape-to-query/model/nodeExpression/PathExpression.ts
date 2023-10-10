import { Term } from 'rdf-js'
import type { GraphPointer } from 'clownface'
import { isBlankNode, isGraphPointer } from 'is-graph-pointer'
import { sh } from '@tpluscode/rdf-ns-builders'
import { sparql, SparqlTemplateResult } from '@tpluscode/sparql-builder'
import { toSparql } from 'clownface-shacl-path'
import { ModelFactory } from '../ModelFactory.js'
import { getOne, getOneOrZero } from './util.js'
import NodeExpressionBase, { NodeExpression, Parameters, PatternBuilder } from './NodeExpression.js'

export class PathExpression extends NodeExpressionBase {
  static match(pointer: GraphPointer) {
    return isBlankNode(pointer) && isGraphPointer(pointer.out(sh.path))
  }

  static fromPointer(pointer: GraphPointer, fromNode: ModelFactory) {
    const path = getOne(pointer, sh.path)
    const nodes = getOneOrZero(pointer, sh.nodes)

    if (nodes) {
      return new PathExpression(pointer.term, toSparql(path), fromNode.nodeExpression(nodes))
    }

    return new PathExpression(pointer.term, toSparql(path))
  }

  constructor(public readonly term: Term, public readonly path: SparqlTemplateResult, public readonly nodes?: NodeExpression) {
    super()
  }

  _buildPatterns({ subject, object, variable, rootPatterns }: Parameters, builder: PatternBuilder) {
    if (this.nodes) {
      const inner = builder.build(this.nodes, { subject, variable, rootPatterns })
      const joined = inner.object
      return sparql`
        ${inner.patterns}
        ${joined} ${this.path} ${object} .
      `
    }

    return sparql`${subject} ${this.path} ${object} .`
  }
}
