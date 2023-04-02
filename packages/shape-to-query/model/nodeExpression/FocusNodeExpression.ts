import { sparql, SparqlTemplateResult } from '@tpluscode/sparql-builder'
import { sh } from '@tpluscode/rdf-ns-builders'
import { GraphPointer } from 'clownface'
import { NodeExpression, Parameters } from './NodeExpression.js'

export class FocusNodeExpression implements NodeExpression {
  static match({ term }: GraphPointer) {
    return term.equals(sh.this)
  }

  static fromPointer() {
    return new FocusNodeExpression()
  }

  buildPatterns({ subject, object }: Omit<Parameters, 'rootPatterns'>): SparqlTemplateResult {
    return sparql`BIND (${subject} as ${object})`
  }

  buildInlineExpression(arg: Parameters) {
    return {
      inline: sparql`${arg.subject}`,
    }
  }
}
