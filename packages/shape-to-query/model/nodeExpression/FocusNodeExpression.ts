import { sparql, SparqlTemplateResult } from '@tpluscode/sparql-builder'
import { NodeExpression, Parameters } from './index'

export class FocusNodeExpression implements NodeExpression {
  buildPatterns({ subject, object }: Parameters): SparqlTemplateResult {
    return sparql`BIND (${subject} as ${object})`
  }
}
