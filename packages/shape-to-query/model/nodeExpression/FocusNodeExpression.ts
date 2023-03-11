import { sparql, SparqlTemplateResult } from '@tpluscode/sparql-builder'
import { sh } from '@tpluscode/rdf-ns-builders'
import { GraphPointer } from 'clownface'
import { NodeExpression, Parameters } from './index'

export class FocusNodeExpression implements NodeExpression {
  static match({ term }: GraphPointer) {
    return term.equals(sh.this)
  }

  static fromPointer() {
    return new FocusNodeExpression()
  }

  buildPatterns({ subject, object }: Parameters): SparqlTemplateResult {
    return sparql`BIND (${subject} as ${object})`
  }
}
