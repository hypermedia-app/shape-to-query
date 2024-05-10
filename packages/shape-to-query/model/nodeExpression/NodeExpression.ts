import type { Term, Variable } from '@rdfjs/types'
import { Select, SparqlTemplateResult } from '@tpluscode/sparql-builder'
import $rdf from '@zazuko/env/web.js'
import type TermMap from '@rdfjs/term-map'
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
  /**
   * True if a built node expression requires all query patterns leading from shape target to current node
   */
  requiresFullContext?: boolean
}

interface InlineExpressionResult {
  inline: SparqlTemplateResult
  patterns?: SparqlTemplateResult
}

export class PatternBuilder {
  private readonly results: TermMap<Term, NodeExpressionResult> = $rdf.termMap()

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
  buildInlineExpression?(arg: Parameters, builder: PatternBuilder): InlineExpressionResult

  /**
   * True if a node expression requires all query patterns leading from shape target to current node
   */
  requiresFullContext: boolean
}

export default abstract class {
  build({ subject, rootPatterns, variable, object = variable() }: Parameters, builder: PatternBuilder): NodeExpressionResult {
    const patterns = this._buildPatterns({ subject, rootPatterns, variable, object }, builder)
    return {
      patterns,
      object,
      requiresFullContext: this.requiresFullContext,
    }
  }

  public abstract get requiresFullContext(): boolean

  protected abstract _buildPatterns(arg: Required<Parameters>, builder: PatternBuilder): Select | SparqlTemplateResult
}
