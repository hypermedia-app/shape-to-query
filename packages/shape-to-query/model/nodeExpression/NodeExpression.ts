import { Variable } from 'rdf-js'
import { Select, SparqlTemplateResult } from '@tpluscode/sparql-builder'
import { FocusNode } from '../../lib/FocusNode'
import { VariableSequence } from '../../lib/variableSequence'

export interface Parameters {
  subject: FocusNode
  object: Variable
  variable: VariableSequence
  rootPatterns: SparqlTemplateResult
}

export interface NodeExpression {
  buildPatterns(arg: Parameters): Select | SparqlTemplateResult
}
