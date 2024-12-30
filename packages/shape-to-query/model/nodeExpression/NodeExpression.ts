import type { Term, Variable } from '@rdfjs/types'
import $rdf from '@zazuko/env/web.js'
import type TermMap from '@rdfjs/term-map'
import type sparqljs from 'sparqljs'
import type { FocusNode } from '../../lib/FocusNode.js'
import type { VariableSequence } from '../../lib/variableSequence.js'

export interface Parameters {
  subject: FocusNode
  object?: Variable
  variable: VariableSequence
  rootPatterns: sparqljs.Pattern[]
}

export interface NodeExpressionResult {
  patterns: sparqljs.Pattern[]
  object: Variable
  /**
   * True if a built node expression requires all query patterns leading from shape target to current node
   */
  requiresFullContext?: boolean
}

export interface InlineExpressionResult {
  inline: sparqljs.Expression
  patterns?: sparqljs.Pattern[]
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

  get rootIsFocusNode(): boolean
}

export default abstract class implements NodeExpression {
  term: Term

  build({ subject, rootPatterns, variable, object = variable() }: Parameters, builder: PatternBuilder): NodeExpressionResult {
    const patterns = this._buildPatterns({ subject, rootPatterns, variable, object }, builder)
    const inlineFocusNode = this.rootIsFocusNode && subject.termType === 'Variable'

    return {
      patterns: Array.isArray(patterns) ? patterns : [patterns],
      object: inlineFocusNode ? subject : object,
      requiresFullContext: this.requiresFullContext,
    }
  }

  public abstract get requiresFullContext(): boolean
  public abstract get rootIsFocusNode(): boolean
  protected abstract _buildPatterns(arg: Required<Parameters>, builder: PatternBuilder): sparqljs.Pattern[] | sparqljs.Pattern
}
