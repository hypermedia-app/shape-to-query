import { sh } from '@tpluscode/rdf-ns-builders'
import type { GraphPointer } from 'clownface'
import type sparqljs from 'sparqljs'
import NodeExpression, { InlineExpressionResult, Parameters } from './NodeExpression.js'

export class FocusNodeExpression extends NodeExpression {
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

  _buildPatterns({ subject, object }: Omit<Parameters, 'rootPatterns'>): sparqljs.BindPattern {
    return {
      type: 'bind',
      expression: subject,
      variable: object,
    }
  }

  buildInlineExpression(arg: Parameters): InlineExpressionResult {
    return {
      inline: arg.subject,
    }
  }
}
