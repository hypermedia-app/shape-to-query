import { NamedNode, Literal } from 'rdf-js'
import { sparql } from '@tpluscode/sparql-builder'
import { GraphPointer } from 'clownface'
import { isLiteral, isNamedNode } from 'is-graph-pointer'
import { sh } from '@tpluscode/rdf-ns-builders'
import { NodeExpression, Parameters } from './NodeExpression.js'

export class ConstantTermExpression implements NodeExpression {
  constructor(public readonly term: NamedNode | Literal) {
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

  buildPatterns({ variable }: Omit<Parameters, 'rootPatterns'>) {
    const object = variable()
    return {
      object,
      patterns: sparql`BIND(${this.term} as ${object})`,
    }
  }

  buildInlineExpression(arg: Parameters) {
    return {
      inline: sparql`${this.term}`,
    }
  }
}
