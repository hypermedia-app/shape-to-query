import { Variable } from 'rdf-js'
import { SparqlTemplateResult } from '@tpluscode/sparql-builder'
import { VariableSequence } from '../../lib/variableSequence'
import { FocusNode } from '../../lib/FocusNode'

export interface Parameters {
  focusNode: FocusNode
  valueNode: Variable
  variable: VariableSequence
  propertyPath?: SparqlTemplateResult
}

export interface ConstraintComponent {
  buildPatterns(arg: Parameters): SparqlTemplateResult | SparqlTemplateResult[]
}
