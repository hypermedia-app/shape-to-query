import { Term, Variable } from 'rdf-js'
import { Select, SparqlTemplateResult } from '@tpluscode/sparql-builder'
import TermMap from '@rdfjs/term-map'
import { FocusNode } from '../../lib/FocusNode.js'
import { VariableSequence } from '../../lib/variableSequence.js'

export class PatternBuilder {
  private readonly results = new TermMap<Term, NodeExpressionResult>()

  build(expr: NodeExpression, args: Parameters): NodeExpressionResult {
    const result = this.results.get(expr.term) || expr.buildPatterns({ ...args, builder: this })
    this.results.set(expr.term, result)

    return result
  }
}

export interface Parameters {
  subject: FocusNode
  variable: VariableSequence
  rootPatterns: SparqlTemplateResult
  builder: PatternBuilder
}

export interface NodeExpressionResult {
  patterns: Select | SparqlTemplateResult
  object: Variable
}

export interface NodeExpression {
  readonly term: Term

  buildPatterns(arg: Parameters): NodeExpressionResult

  /**
   * Implemented to have the expression result inlined in the parent expression.
   */
  buildInlineExpression?(arg: Parameters): {
    inline: SparqlTemplateResult
    patterns?: SparqlTemplateResult
  }
}
