import { Variable } from 'rdf-js'
import { Select, SparqlTemplateResult } from '@tpluscode/sparql-builder'
import { FocusNode } from '../../lib/FocusNode.js'
import { VariableSequence } from '../../lib/variableSequence.js'

export interface Parameters {
  subject: FocusNode
  object: Variable
  variable: VariableSequence
  rootPatterns: SparqlTemplateResult
}

export interface NodeExpression {
  buildPatterns(arg: Parameters): Select | SparqlTemplateResult

  /**
   * Implemented to have the expression result inlined in the parent expression.
   */
  buildInlineExpression?(arg: Parameters): {
    inline: SparqlTemplateResult
    patterns?: SparqlTemplateResult
  }
}
