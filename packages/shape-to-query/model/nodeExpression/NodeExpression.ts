import { Term, Variable } from 'rdf-js'
import { Select, SparqlTemplateResult } from '@tpluscode/sparql-builder'
import $rdf from 'rdf-ext'
import { FocusNode } from '../../lib/FocusNode.js'
import { VariableSequence } from '../../lib/variableSequence.js'

export interface Parameters {
  subject: FocusNode
  object?: Variable
  variable: VariableSequence
  rootPatterns: SparqlTemplateResult
}

export interface NodeExpressionResult {
  patterns: Select | SparqlTemplateResult
  object: Variable
}

export class PatternBuilder {
  private readonly results = $rdf.termMap<Term, NodeExpressionResult>()

  // eslint-disable-next-line no-use-before-define
  build(expr: NodeExpression, args: Parameters): NodeExpressionResult {
    const result = this.results.get(expr.term) || expr.build(args, this)
    this.results.set(expr.term, result)

    return result
  }
}

export interface NodeExpression {
  readonly term: Term

  build(params: Parameters, builder: PatternBuilder): NodeExpressionResult

  /**
   * Implemented to have the expression result inlined in the parent expression.
   */
  buildInlineExpression?(arg: Parameters, builder: PatternBuilder): {
    inline: SparqlTemplateResult
    patterns?: SparqlTemplateResult
  }
}

export default abstract class {
  build({ subject, rootPatterns, variable, object = variable() }: Parameters, builder: PatternBuilder): NodeExpressionResult {
    const patterns = this._buildPatterns({ subject, rootPatterns, variable, object }, builder)
    return { patterns, object }
  }

  protected abstract _buildPatterns(arg: Required<Parameters>, builder: PatternBuilder): Select | SparqlTemplateResult
}
