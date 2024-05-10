import type { NamedNode, Literal } from '@rdfjs/types'
import { sparql } from '@tpluscode/sparql-builder'
import type { GraphPointer } from 'clownface'
import { isLiteral, isNamedNode } from 'is-graph-pointer'
import { sh } from '@tpluscode/rdf-ns-builders'
import NodeExpression, { Parameters } from './NodeExpression.js'

export class ConstantTermExpression extends NodeExpression {
  public get requiresFullContext(): boolean {
    return false
  }

  constructor(public readonly term: NamedNode | Literal) {
    super()
  }

  static fromPointer(pointer: GraphPointer) {
    if (!ConstantTermExpression.match(pointer)) {
      throw new Error('Constant term must be a named node or literal')
    }

    return new ConstantTermExpression(pointer.term)
  }

  static match(pointer: GraphPointer): pointer is GraphPointer<NamedNode | Literal> {
    if (isNamedNode(pointer)) {
      return !pointer.term.equals(sh.this)
    }

    return isLiteral(pointer)
  }

  _buildPatterns({ object }: Omit<Parameters, 'rootPatterns'>) {
    return sparql`BIND(${this.term} as ${object})`
  }

  buildInlineExpression() {
    return {
      inline: sparql`${this.term}`,
    }
  }
}
