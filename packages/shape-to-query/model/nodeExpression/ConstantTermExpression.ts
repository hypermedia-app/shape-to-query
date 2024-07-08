import type { NamedNode, Literal } from '@rdfjs/types'
import type { GraphPointer } from 'clownface'
import { isLiteral, isNamedNode } from 'is-graph-pointer'
import { sh } from '@tpluscode/rdf-ns-builders'
import type sparqljs from 'sparqljs'
import NodeExpression, { InlineExpressionResult, Parameters } from './NodeExpression.js'

export class ConstantTermExpression extends NodeExpression {
  public get requiresFullContext(): boolean {
    return false
  }

  public get rootIsFocusNode() {
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

  _buildPatterns({ object }: Omit<Parameters, 'rootPatterns'>): sparqljs.BindPattern {
    return {
      type: 'bind',
      expression: this.term,
      variable: object,
    }
  }

  buildInlineExpression(): InlineExpressionResult {
    return {
      inline: this.term,
    }
  }
}
