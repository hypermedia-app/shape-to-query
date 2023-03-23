import { NamedNode, Variable } from 'rdf-js'
import { SparqlTemplateResult } from '@tpluscode/sparql-builder'
import { VariableSequence } from '../../lib/variableSequence.js'
import { FocusNode } from '../../lib/FocusNode.js'

export interface Parameters {
  focusNode: FocusNode
  valueNode: Variable
  variable: VariableSequence
  propertyPath?: SparqlTemplateResult
}

export abstract class ConstraintComponent {
  protected constructor(public readonly type: NamedNode) {
  }

  abstract buildPatterns(arg: Parameters): string | SparqlTemplateResult | SparqlTemplateResult[]
}
