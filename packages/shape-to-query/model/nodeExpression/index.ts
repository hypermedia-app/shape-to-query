import { Variable } from 'rdf-js'
import { SparqlTemplateResult } from '@tpluscode/sparql-builder'
import { FocusNode } from '../../lib/FocusNode'

export interface Parameters {
  subject: FocusNode
  object: Variable
}

export interface NodeExpression {
  buildPatterns(arg: Parameters): SparqlTemplateResult
}
