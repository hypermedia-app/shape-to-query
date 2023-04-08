import { NamedNode, Literal } from 'rdf-js'
import { SparqlTemplateResult, sparql } from '@tpluscode/sparql-builder'
import { GraphPointer } from 'clownface'
import { isLiteral, isNamedNode } from 'is-graph-pointer'
import { sh } from '@tpluscode/rdf-ns-builders'
import { NodeExpression, Parameters } from './NodeExpression.js'

export class ConstantTermExpression implements NodeExpression {
  constructor(private readonly node: NamedNode | Literal) {
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

  buildPatterns({ object }: Omit<Parameters, 'rootPatterns'>): SparqlTemplateResult {
    return sparql`BIND(${this.node} as ${object})`
  }

  buildInlineExpression(arg: Parameters) {
    return {
      inline: sparql`${this.node}`,
    }
  }
}
