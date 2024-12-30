import { sh } from '@tpluscode/rdf-ns-builders'
import type { GraphPointer } from 'clownface'
import type { InlineExpressionResult, NodeExpressionResult, Parameters, NodeExpression } from './NodeExpression.js'

export class FocusNodeExpression implements NodeExpression {
  public readonly term = sh.this

  static match({ term }: GraphPointer) {
    return term.equals(sh.this)
  }

  static fromPointer() {
    return new FocusNodeExpression()
  }

  get requiresFullContext() {
    return true
  }

  public get rootIsFocusNode() {
    return true
  }

  build({ subject, variable, object = variable() }: Parameters): NodeExpressionResult {
    const inlineSubjectNode = this.rootIsFocusNode && subject.termType === 'Variable'
    if (inlineSubjectNode) {
      return {
        patterns: [],
        object: subject,
        requiresFullContext: this.requiresFullContext,
      }
    }

    return {
      patterns: [{
        type: 'bind',
        expression: subject,
        variable: object,
      }],
      object,
      requiresFullContext: this.requiresFullContext,
    }
  }

  buildInlineExpression(arg: Parameters): InlineExpressionResult {
    return {
      inline: arg.subject,
    }
  }
}
