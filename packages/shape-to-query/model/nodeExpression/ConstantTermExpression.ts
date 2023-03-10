import { NamedNode, Literal, Term } from 'rdf-js'
import { SparqlTemplateResult, sparql } from '@tpluscode/sparql-builder'
import { GraphPointer } from 'clownface'
import { isLiteral, isNamedNode } from 'is-graph-pointer'
import { sh } from '@tpluscode/rdf-ns-builders'
import { NodeExpression, Parameters } from './index'

/**
 * Implements constant node expressions and focus node expression
 */
export class ConstantTermExpression implements NodeExpression {
  private readonly node: NamedNode | Literal

  constructor(pointer: GraphPointer) {
    if (!ConstantTermExpression.match(pointer)) {
      throw new Error('Constant term must be a named node or literal')
    }

    this.node = pointer.term
  }

  static match(pointer: GraphPointer): pointer is GraphPointer<NamedNode | Literal> {
    if (isNamedNode(pointer)) {
      return !pointer.term.equals(sh.this)
    }

    return isLiteral(pointer)
  }

  buildPatterns({ subject, object }: Parameters): SparqlTemplateResult {
    let node: Term = this.node
    if (node.equals(sh.this)) {
      node = subject
    }

    return sparql`BIND(${node} as ${object})`
  }
}
